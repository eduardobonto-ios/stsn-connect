/**
 * STSN Connect Demo PDF — Phase 3: Screenshot Replacement
 *
 * Replaces the cream placeholder box (Image2, ~4221×1109 px) on each page of
 * demo.pdf with the matching real screenshot from demo-screenshots/.
 *
 * Strategy:
 *  - Load demo.pdf (Downloads) with pdf-lib
 *  - For each page that has a placeholder, locate the /Image2 XObject
 *  - Crop the screenshot to the placeholder aspect ratio (top crop, full width)
 *  - Re-encode as JPEG and replace the XObject bytes in-place
 *  - Update Width/Height/Length in the XObject dict
 *  - Write STSN_Connect_Demo_Guide_With_Screenshots.pdf
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import sharp from 'sharp';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const INPUT_PDF   = 'C:/Users/VELOSO/Downloads/demo.pdf';
const SHOTS_DIR   = join(__dirname, 'demo-screenshots');
const OUTPUT_PDF  = join(__dirname, 'STSN_Connect_Demo_Guide_With_Screenshots.pdf');

// ── Page → Screenshot mapping (derived from decoded page text) ────────────────
// Key = 1-based PDF page number, value = screenshot filename in demo-screenshots/
// Pages NOT listed here have no placeholder (divider/intro pages) or are skipped.

const PAGE_MAP = {
  //  SUPER ADMIN section (pages 4–37, dividers at 7, 28, 30)
   4: 'dashboard-super-admin.png',
   5: 'action-center-super-admin.png',
   6: 'enrollment-admissions-directory.png',
   8: 'student-directory.png',
   9: 'class-sectioning.png',
  10: 'class-scheduling.png',
  11: 'faculty-management.png',
  12: 'curriculum-syllabus-pathways.png',
  13: 'grades-directory.png',
  14: 'registrar-reports.png',
  15: 'accounting-dashboard.png',
  16: 'student-accounts.png',
  17: 'accounting-setup.png',
  18: 'journal-entries.png',
  19: 'accounts-receivable.png',
  20: 'accounts-payable.png',
  21: 'financial-reports.png',
  22: 'cashiering-office.png',
  23: 'teacher-board.png',
  24: 'grade-encoding.png',
  25: 'online-learning.png',
  26: 'student-portal-super-admin.png',
  27: 'hr-management.png',
  29: 'payroll-dashboard.png',
  31: 'guidance-office.png',
  32: 'guidance-reports.png',
  33: 'clinic-module.png',
  34: 'consultation.png',
  35: 'clinic-reports.png',
  36: 'user-access-authority.png',
  37: 'core-setup.png',

  // SCHOOL ADMIN section (pages 39–45, dividers at 38, 43)
  39: 'dashboard-school-admin.png',
  40: 'action-center-school-admin.png',
  41: 'student-directory-school-admin.png',
  42: 'hr-management-school-admin.png',
  44: 'registrar-reports-school-admin.png',
  45: 'admin-reports.png',

  // PRINCIPAL section (pages 47–53, divider at 46)
  // No principal-specific captures; reuse super-admin equivalents
  47: 'action-center-super-admin.png',
  48: 'student-directory.png',
  49: 'grades-directory.png',
  50: 'curriculum-syllabus-pathways.png',
  51: 'faculty-management.png',
  52: 'class-scheduling.png',
  53: 'registrar-reports.png',

  // REGISTRAR section (pages 55–65, dividers at 54, 57)
  55: 'action-center-registrar.png',
  56: 'enrollment-registrar.png',
  58: 'student-directory.png',
  59: 'class-sectioning.png',
  60: 'class-scheduling.png',
  61: 'faculty-management.png',
  62: 'curriculum-syllabus-pathways.png',
  63: 'grades-directory.png',
  // 64: 'books-setup.png' — MISSING (no nav entry); skip, leave placeholder
  65: 'registrar-reports.png',

  // ACCOUNTING STAFF section (pages 67–75, divider at 66)
  67: 'action-center-accounting.png',
  68: 'accounting-dashboard.png',       // accounting-dashboard from super-admin (role lacks permission)
  69: 'student-accounts-accounting.png',
  70: 'accounting-setup-accounting.png',
  71: 'journal-entries-accounting.png',
  72: 'accounts-receivable-accounting.png',
  73: 'accounts-payable-accounting.png',
  74: 'financial-reports-accounting.png',
  // 75: 'books-setup.png' — MISSING; skip, leave placeholder

  // CASHIER section (page 77, divider at 76)
  77: 'cashiering-office.png',

  // TEACHER section (pages 79–82, divider at 78)
  79: 'teacher-board.png',
  80: 'grade-encoding.png',
  81: 'curriculum-teacher.png',
  82: 'online-learning-teacher.png',

  // STUDENT section (pages 84–86, divider at 83)
  84: 'student-portal.png',
  85: 'online-learning-student.png',
  86: 'consultation-student.png',

  // HR MANAGER section (pages 88–89, dividers at 87, 90)
  88: 'action-center-hr.png',
  89: 'hr-management.png',

  // GUIDANCE COUNSELOR section (pages 92–93, divider at 91)
  92: 'guidance-office-counselor.png',
  93: 'guidance-reports-counselor.png',

  // SCHOOL NURSE section (pages 95–97, divider at 94)
  95: 'clinic-module-nurse.png',
  96: 'consultation.png',               // fallback: nurse lacks CONSULTATION permission
  97: 'clinic-reports-nurse.png',

  // PAYROLL OFFICER section (pages 99–100, dividers at 98, 101)
  99: 'action-center-payroll.png',
 100: 'payroll-management.png',

  // PARENT/GUARDIAN section (page 103, divider at 102)
  // 103: 'parent-portal.png' — MISSING (no guardian user in DB); skip
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Prepare a screenshot for embedding:
 *  - Crops to the target aspect ratio (full width, top-crop)
 *  - Re-encodes as JPEG at 90% quality
 *  Returns { jpegBuf, width, height }
 */
async function prepareScreenshot(srcPath, targetAspect) {
  const meta = await sharp(srcPath).metadata();
  const srcW = meta.width;
  const srcH = meta.height;

  // Crop height to match target aspect ratio (full width)
  const cropH = Math.round(srcW / targetAspect);
  const cropH2 = Math.min(cropH, srcH); // can't exceed source height

  const jpegBuf = await sharp(srcPath)
    .extract({ left: 0, top: 0, width: srcW, height: cropH2 })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  return { jpegBuf, width: srcW, height: cropH2 };
}

/**
 * Get the placeholder Image2 display aspect ratio from the content stream.
 * Parses the cm matrix for /Image2 Do to get (w, h) in design units.
 */
function getImg2Aspect(contentText) {
  // Pattern: q <a b c d e f> cm /Image2 Do Q
  const pat = /q\s+([\d.\-]+)\s+[\d.\-]+\s+[\d.\-]+\s+([\d.\-]+)\s+[\d.\-]+\s+[\d.\-]+\s+cm\s+\/Image2\s+Do\s+Q/;
  const m = pat.exec(contentText);
  if (!m) return null;
  const a = Math.abs(parseFloat(m[1])); // width in design units
  const d = Math.abs(parseFloat(m[2])); // height in design units
  return a / d; // aspect ratio
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading PDF…');
  const pdfBytes = readFileSync(INPUT_PDF);
  const pdfDoc   = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
  const pageCount = pdfDoc.getPageCount();
  console.log('Pages:', pageCount);

  const replaced = [];
  const skipped  = [];
  const noShot   = [];

  for (let pi = 0; pi < pageCount; pi++) {
    const pageNum = pi + 1;
    const shotFile = PAGE_MAP[pageNum];

    if (!shotFile) continue; // not in map — no replacement needed

    const shotPath = join(SHOTS_DIR, shotFile);
    if (!existsSync(shotPath)) {
      console.log(`  P${pageNum}: ✗ file not found: ${shotFile}`);
      noShot.push({ page: pageNum, file: shotFile });
      continue;
    }

    // Get the page resources
    const page = pdfDoc.getPage(pi);
    const resources = page.node.lookup(PDFName.of('Resources'));
    const xObjects  = resources?.lookup?.(PDFName.of('XObject'));
    if (!xObjects) { skipped.push({ page: pageNum, reason: 'no XObject' }); continue; }

    const img2ref = xObjects.lookup(PDFName.of('Image2'));
    if (!img2ref) { skipped.push({ page: pageNum, reason: 'no Image2' }); continue; }

    const img2 = pdfDoc.context.lookup(img2ref);
    if (!img2?.dict || !img2.contents) { skipped.push({ page: pageNum, reason: 'Image2 has no content' }); continue; }

    // Get content stream to determine aspect ratio
    let contentText = '';
    const contents = page.node.lookup(PDFName.of('Contents'));
    if (contents) {
      const streamRef = contents.constructor.name === 'PDFArray' ? contents.get(0) : contents;
      const stream = pdfDoc.context.lookup(streamRef);
      if (stream?.contents) {
        const { default: zlib } = await import('zlib');
        try { contentText = zlib.inflateSync(Buffer.from(stream.contents)).toString('latin1'); }
        catch { contentText = Buffer.from(stream.contents).toString('latin1'); }
      }
    }

    const aspect = getImg2Aspect(contentText) ?? (676 / 177.6); // fallback ~3.81

    // Prepare the screenshot
    let img;
    try {
      img = await prepareScreenshot(shotPath, aspect);
    } catch (e) {
      console.error(`  P${pageNum}: ✗ sharp error: ${e.message}`);
      skipped.push({ page: pageNum, reason: e.message }); continue;
    }

    // Patch the XObject in-place
    // Replace contents
    img2.contents = new Uint8Array(img.jpegBuf);
    // Update dict entries
    img2.dict.set(PDFName.of('Width'),   PDFNumber.of(img.width));
    img2.dict.set(PDFName.of('Height'),  PDFNumber.of(img.height));
    img2.dict.set(PDFName.of('Length'),  PDFNumber.of(img.jpegBuf.length));
    // Ensure correct filter (JPEG)
    img2.dict.set(PDFName.of('Filter'),  PDFName.of('DCTDecode'));
    // Color space: RGB
    img2.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
    img2.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));

    console.log(`  P${pageNum} ✓  ${shotFile}  (${img.width}×${img.height} JPEG, ${(img.jpegBuf.length/1024).toFixed(0)}KB)`);
    replaced.push({ page: pageNum, file: shotFile, w: img.width, h: img.height });
  }

  // Save
  console.log('\nSaving PDF…');
  const outBytes = await pdfDoc.save({ useObjectStreams: false });
  writeFileSync(OUTPUT_PDF, outBytes);
  const sizeMB = (outBytes.length / 1024 / 1024).toFixed(1);
  console.log(`Saved → ${OUTPUT_PDF} (${sizeMB} MB)`);

  // Report
  console.log('\n' + '─'.repeat(72));
  console.log(`Pages replaced: ${replaced.length}`);
  console.log(`Pages skipped (no Image2): ${skipped.length}`);
  console.log(`Pages with missing screenshot file: ${noShot.length}`);

  if (noShot.length) {
    console.log('\nMissing screenshot files (placeholders left intact):');
    noShot.forEach(s => console.log(`  P${s.page}: ${s.file}`));
  }
  if (skipped.length) {
    console.log('\nSkipped pages:');
    skipped.forEach(s => console.log(`  P${s.page}: ${s.reason}`));
  }

  // Summary JSON
  const summary = {
    timestamp: new Date().toISOString(),
    inputPdf: INPUT_PDF,
    outputPdf: OUTPUT_PDF,
    outputSizeMB: parseFloat(sizeMB),
    replaced,
    skipped,
    noScreenshot: noShot,
  };
  writeFileSync(join(__dirname, 'phase3-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nSummary → phase3-summary.json');
}

main().catch(e => { console.error('FATAL:', e.message, '\n', e.stack); process.exit(1); });

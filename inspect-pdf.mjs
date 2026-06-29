/**
 * PDF placeholder inspector — uses pdf-lib for page access, raw content-stream
 * tokenizer to find large filled rectangles (the screenshot placeholder boxes).
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, PDFName, PDFArray, PDFRef, PDFStream, PDFRawStream } from 'pdf-lib';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_PATH  = 'C:/Users/VELOSO/Downloads/demo.pdf';

// ── Content-stream tokenizer ──────────────────────────────────────────────────

function tokenize(buf) {
  const tokens = [];
  let i = 0;
  while (i < buf.length) {
    // skip whitespace
    while (i < buf.length && buf[i] <= 0x20) i++;
    if (i >= buf.length) break;

    const c = buf[i];

    // Comment
    if (c === 0x25) { while (i < buf.length && buf[i] !== 0x0a && buf[i] !== 0x0d) i++; continue; }

    // Number or operator character
    // Read a token up to whitespace or delimiters
    let start = i;
    if (c === 0x28) { // literal string
      let depth = 1; i++;
      while (i < buf.length && depth > 0) {
        if (buf[i] === 0x5c) i++; // escape
        else if (buf[i] === 0x28) depth++;
        else if (buf[i] === 0x29) depth--;
        i++;
      }
      tokens.push({ type: 'str', val: buf.slice(start, i).toString('latin1') });
      continue;
    }
    if (c === 0x3c && buf[i+1] === 0x3c) { tokens.push({ type:'op', val:'<<' }); i+=2; continue; }
    if (c === 0x3e && buf[i+1] === 0x3e) { tokens.push({ type:'op', val:'>>' }); i+=2; continue; }
    if (c === 0x3c) { // hex string
      while (i < buf.length && buf[i] !== 0x3e) i++; i++;
      tokens.push({ type:'str', val:'' });
      continue;
    }

    while (i < buf.length && buf[i] > 0x20 && buf[i] !== 0x28 && buf[i] !== 0x29 &&
           buf[i] !== 0x3c && buf[i] !== 0x3e && buf[i] !== 0x5b && buf[i] !== 0x5d) i++;
    const word = buf.slice(start, i).toString('latin1');
    if (!word) { i++; continue; }

    const num = parseFloat(word);
    if (!isNaN(num) && /^-?\d*\.?\d+$/.test(word)) {
      tokens.push({ type: 'num', val: num });
    } else {
      tokens.push({ type: 'op', val: word });
    }
  }
  return tokens;
}

function findRects(buf) {
  const tokens = tokenize(buf);
  const stack = [];
  let fr = 0, fg = 0, fb = 0;
  const rects = [];

  for (const tok of tokens) {
    if (tok.type === 'num') { stack.push(tok.val); continue; }
    if (tok.type !== 'op') { stack.length = 0; continue; }

    switch (tok.val) {
      case 'rg': // r g b rg — non-stroke RGB
        if (stack.length >= 3) { fb = stack.pop(); fg = stack.pop(); fr = stack.pop(); }
        stack.length = 0;
        break;
      case 'g': // gray rg
        if (stack.length >= 1) { const gray = stack.pop(); fr=fg=fb=gray; }
        stack.length = 0;
        break;
      case 'k': { // c m y k — cmyk non-stroke
        if (stack.length >= 4) {
          const k2=stack.pop(), y2=stack.pop(), m2=stack.pop(), c2=stack.pop();
          fr=(1-c2)*(1-k2); fg=(1-m2)*(1-k2); fb=(1-y2)*(1-k2);
        }
        stack.length = 0;
        break;
      }
      case 'sc':
      case 'scn':
        // generic non-stroke — may be custom CS; ignore for now
        stack.length = 0;
        break;
      case 're': // x y w h re
        if (stack.length >= 4) {
          const h = stack.pop(), w = stack.pop(), y = stack.pop(), x = stack.pop();
          if (Math.abs(w) > 80 && Math.abs(h) > 50) {
            rects.push({ x, y, w: Math.abs(w), h: Math.abs(h), r: fr, g: fg, b: fb });
          }
          stack.length = 0;
        }
        break;
      default:
        stack.length = 0;
    }
  }
  return rects;
}

// ── Inflate stream data ───────────────────────────────────────────────────────

function decompressStream(stream) {
  // pdf-lib gives us PDFRawStream or PDFStream
  let bytes = stream.contents ?? stream.getContents?.() ?? null;
  if (!bytes) return Buffer.alloc(0);

  const filter = stream.dict?.lookup(PDFName.of('Filter'));
  const filterName = filter instanceof PDFName ? filter.asString()
    : (filter instanceof PDFArray ? filter.get(0)?.asString?.() ?? '' : '');

  if (filterName === '/FlateDecode' || filterName === 'FlateDecode') {
    try { return Buffer.from(zlib.inflateSync(Buffer.from(bytes))); } catch {
      try { return Buffer.from(zlib.inflateRawSync(Buffer.from(bytes))); } catch {
        return Buffer.from(bytes);
      }
    }
  }
  return Buffer.from(bytes);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Loading ${PDF_PATH}…`);
  const pdfBytes = readFileSync(PDF_PATH);
  const pdfDoc   = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
  const pageCount = pdfDoc.getPageCount();
  console.log(`Pages: ${pageCount}`);
  console.log('─'.repeat(72));

  const results = [];

  for (let pi = 0; pi < pageCount; pi++) {
    const page  = pdfDoc.getPage(pi);
    const { width: pageW, height: pageH } = page.getSize();

    // Get content stream(s)
    const contentsRef = page.node.lookup(PDFName.of('Contents'));
    if (!contentsRef) continue;

    const streamBufs = [];
    const collectStream = ref => {
      const obj = pdfDoc.context.lookup(ref);
      if (!obj) return;
      if (obj instanceof PDFArray) {
        for (let k = 0; k < obj.size(); k++) collectStream(obj.get(k));
      } else if (obj instanceof PDFRawStream || (obj && obj.dict && obj.contents)) {
        streamBufs.push(decompressStream(obj));
      }
    };
    collectStream(contentsRef);

    if (streamBufs.length === 0) continue;
    const combined = Buffer.concat(streamBufs);
    const rects    = findRects(combined);

    if (rects.length > 0) {
      const pageLabel = `Page ${pi + 1}`;
      console.log(`${pageLabel} (${pageW.toFixed(0)}×${pageH.toFixed(0)} pts): ${rects.length} large rect(s)`);
      rects.forEach(r => {
        const rgb = `rgb(${(r.r*255).toFixed(0)},${(r.g*255).toFixed(0)},${(r.b*255).toFixed(0)})`;
        console.log(`  x=${r.x.toFixed(1)} y=${r.y.toFixed(1)} w=${r.w.toFixed(1)} h=${r.h.toFixed(1)}  fill=${rgb}`);
      });
      results.push({ page: pi + 1, pageW, pageH, rects });
    }
  }

  console.log('─'.repeat(72));
  console.log(`Pages with large rects: ${results.length}`);

  writeFileSync(join(__dirname, 'pdf-rects.json'), JSON.stringify(results, null, 2));
  console.log('Saved → pdf-rects.json');
}

main().catch(e => { console.error('FATAL:', e.message, '\n', e.stack); process.exit(1); });

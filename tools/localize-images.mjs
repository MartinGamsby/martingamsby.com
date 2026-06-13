// Localize post preview images: download every external `image:` (and re-encode
// any local one) into two self-hosted webp derivatives so the post list doesn't
// pull a full-size image just to draw a 56px thumbnail.
//
// Files are named after the post slug (SEO-friendly, e.g. 2026-06-11-11-years)
// rather than an opaque hash:
//   image      -> /assets/posts/<slug>.header.webp   (large, max 1200px wide)
//   imageThumb -> /assets/posts/<slug>.thumb.webp    (160x160 cover, for the list)
//
// The frontmatter is rewritten in place; the post body is left byte-for-byte
// untouched (we only edit the two image: lines inside the --- block).
//
// Usage:
//   node tools/localize-images.mjs                 # backfill every post (+ prune orphans)
//   node tools/localize-images.mjs --file <a.md>   # one file — the WriterHelper hook
//   node tools/localize-images.mjs --dry-run       # report, write nothing
//   node tools/localize-images.mjs --force         # re-encode even if files exist
//
// Idempotent: a post already pointing at its canonical /assets/posts/<slug>.* is
// left as-is. An already-localized post under a different name (e.g. an old hash)
// is renamed by copying the existing derivatives — no re-download. Twins sharing
// an external source download once; the slug naming gives each its own file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(root, 'src', 'content', 'blog');
const PUBLIC_DIR = path.join(root, 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'assets', 'posts');
const OUT_URL_PREFIX = '/assets/posts';

const HEADER_MAX_WIDTH = 1200; // hero is full-width, capped ~22rem tall
const THUMB_SIZE = 160; // list thumbnail renders at 56px → covers ~2.8x DPR
const HEADER_QUALITY = 80;
const THUMB_QUALITY = 72;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--file') args.file = argv[++i];
    else args._.push(a);
  }
  return args;
}

function isExternal(src) {
  return /^(https?:)?\/\//.test(src) || src.startsWith('data:');
}

function isLocalized(src) {
  return src.startsWith(`${OUT_URL_PREFIX}/`);
}

const publicPathOf = (url) => path.join(PUBLIC_DIR, url.replace(/^\/+/, ''));

async function loadSource(src) {
  if (isExternal(src)) {
    const res = await fetch(src, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const abs = publicPathOf(src);
  if (!fs.existsSync(abs)) throw new Error(`local file not found: ${abs}`);
  return fs.readFileSync(abs);
}

async function encodeHeader(input, outPath) {
  await sharp(input)
    .rotate() // honour EXIF orientation
    .resize({ width: HEADER_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: HEADER_QUALITY })
    .toFile(outPath);
}

async function encodeThumb(input, outPath) {
  await sharp(input)
    .rotate()
    .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'cover' })
    .webp({ quality: THUMB_QUALITY })
    .toFile(outPath);
}

// Ensure the slug-named header+thumb exist. `src` is the post's current image
// value (external URL, local original, or an already-localized path to rename).
async function ensureDerivatives(src, base, args, bufCache) {
  const headerPath = path.join(OUT_DIR, `${base}.header.webp`);
  const thumbPath = path.join(OUT_DIR, `${base}.thumb.webp`);
  const result = { headerUrl: `${OUT_URL_PREFIX}/${base}.header.webp`, thumbUrl: `${OUT_URL_PREFIX}/${base}.thumb.webp` };

  const haveBoth = fs.existsSync(headerPath) && fs.existsSync(thumbPath);
  if (haveBoth && !args.force) return result;
  if (args.dryRun) return result;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (isLocalized(src)) {
    // Already-optimized derivatives under another name → just copy (rename).
    const oldHeader = publicPathOf(src);
    const oldThumb = publicPathOf(src.replace('.header.webp', '.thumb.webp'));
    if (path.resolve(oldHeader) === path.resolve(headerPath)) return result; // already canonical
    if (!fs.existsSync(oldHeader)) throw new Error(`localized source missing: ${oldHeader}`);
    fs.copyFileSync(oldHeader, headerPath);
    if (fs.existsSync(oldThumb)) fs.copyFileSync(oldThumb, thumbPath);
    else await encodeThumb(oldHeader, thumbPath); // derive a thumb if it was absent
    return result;
  }

  // External URL or local original: fetch once per source, then encode both sizes.
  let buf = bufCache.get(src);
  if (!buf) {
    buf = await loadSource(src);
    bufCache.set(src, buf);
  }
  await encodeHeader(buf, headerPath);
  await encodeThumb(buf, thumbPath);
  return result;
}

// Split a post so we can rewrite only the image lines and leave the body identical.
function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  return { fmLines: m[1].split(/\r?\n/), eol, after: text.slice(m[0].length) };
}

function rewriteFrontmatter(fmLines, headerUrl, thumbUrl) {
  const out = [];
  let wroteThumb = false;
  for (const line of fmLines) {
    if (/^image:\s*/.test(line)) {
      out.push(`image: ${headerUrl}`);
      out.push(`imageThumb: ${thumbUrl}`);
      wroteThumb = true;
    } else if (/^imageThumb:\s*/.test(line)) {
      if (!wroteThumb) {
        out.push(`imageThumb: ${thumbUrl}`);
        wroteThumb = true;
      } // else drop the stale duplicate (already emitted next to image:)
    } else {
      out.push(line);
    }
  }
  return out;
}

async function processFile(file, args, bufCache, referenced) {
  const text = fs.readFileSync(file, 'utf8');
  const split = splitFrontmatter(text);
  if (!split) return { status: 'skip', reason: 'no frontmatter' };

  const imageLine = split.fmLines.find((l) => /^image:\s*/.test(l));
  if (!imageLine) return { status: 'skip', reason: 'no image' };
  const src = imageLine.replace(/^image:\s*/, '').trim().replace(/^['"]|['"]$/g, '');
  if (!src) return { status: 'skip', reason: 'empty image' };

  const base = path.basename(file, '.md'); // YYYY-MM-DD-slug → SEO-friendly, unique
  referenced.add(`${base}.header.webp`);
  referenced.add(`${base}.thumb.webp`);

  const { headerUrl, thumbUrl } = await ensureDerivatives(src, base, args, bufCache);

  const newFm = rewriteFrontmatter(split.fmLines, headerUrl, thumbUrl);
  const rebuilt = `---${split.eol}${newFm.join(split.eol)}${split.eol}---${split.after}`;
  if (rebuilt === text) return { status: 'noop', src };
  if (!args.dryRun) fs.writeFileSync(file, rebuilt);
  return { status: 'ok', src, headerUrl, thumbUrl };
}

function collectFiles(args) {
  if (args.file) return [path.resolve(args.file)];
  const files = [];
  for (const lang of ['fr', 'en']) {
    const dir = path.join(BLOG_DIR, lang);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.md')) files.push(path.join(dir, name));
    }
  }
  return files.sort();
}

const args = parseArgs(process.argv.slice(2));
const files = collectFiles(args);
const bufCache = new Map(); // source string -> downloaded Buffer (per-run dedupe)
const referenced = new Set(); // canonical filenames still in use
let done = 0;
let noop = 0;
const skipped = [];
const failed = [];

for (const file of files) {
  const rel = path.relative(root, file);
  try {
    const r = await processFile(file, args, bufCache, referenced);
    if (r.status === 'ok') {
      done++;
      console.log(`${args.dryRun ? '[dry] ' : ''}✓ ${rel}\n    → ${r.headerUrl} + ${r.thumbUrl}`);
    } else if (r.status === 'noop') {
      noop++;
    } else {
      skipped.push({ rel, reason: r.reason });
    }
  } catch (err) {
    failed.push({ rel, msg: err.message });
    console.error(`✗ ${rel}: ${err.message}`);
  }
}

// Backfill mode prunes derivatives no post references anymore (e.g. old hash names).
let pruned = 0;
if (!args.file && !args.dryRun && fs.existsSync(OUT_DIR)) {
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.endsWith('.webp') && !referenced.has(name)) {
      fs.unlinkSync(path.join(OUT_DIR, name));
      pruned++;
    }
  }
}

console.log(
  `\nDone. ${done} updated, ${noop} already current, ${skipped.length} no-image, ` +
    `${failed.length} failed, ${pruned} orphan file(s) pruned.`,
);
if (failed.length) {
  console.log('Failed (left unchanged — e.g. dead URL):');
  for (const f of failed) console.log(`  - ${f.rel}: ${f.msg}`);
  process.exitCode = 1;
}

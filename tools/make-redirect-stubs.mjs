#!/usr/bin/env node
// Turn the two old Jekyll blogs into redirect shells pointing at the migrated
// posts on the new Astro site (Phase 2, step 2). GitHub Pages has no server
// redirects and jekyll-redirect-from isn't enabled, so we do it plugin-free:
// a `redirect.html` layout emits a <meta http-equiv="refresh"> + canonical, and
// every post is flipped to `layout: redirect` with a `redirect_to:` URL. The
// post body is left in the file (for history / no-JS readers) but isn't rendered.
//
// Target URL: the old permalink is `/:title` (slug = filename minus date); the
// new post keeps the same `<date>-<slug>` stem at `<base>/<lang>/blog/<stem>/`.
//
// Usage
//   node tools/make-redirect-stubs.mjs            # dry run (counts only)
//   node tools/make-redirect-stubs.mjs --write
//   node tools/make-redirect-stubs.mjs --write --target-base https://martingamsby.com
//
// Default target base is the CURRENT live URL (GitHub Pages subpath). At domain
// cutover, re-run with `--target-base https://martingamsby.com` and recommit the
// old repos — one flag, same as flipping `base` in the site's astro.config.mjs.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ghRoot = path.resolve(__dirname, '..', '..');

const REPOS = [
  { lang: 'fr', dir: path.join(ghRoot, 'martingamsby.github.io') },
  { lang: 'en', dir: path.join(ghRoot, 'martingamsby.gitbub.io_en') },
];

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const tbIdx = args.indexOf('--target-base');
const TARGET_BASE = (tbIdx !== -1 ? args[tbIdx + 1] : 'https://martingamsby.github.io/martingamsby.com').replace(/\/+$/, '');

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

const REDIRECT_LAYOUT = `<!DOCTYPE html>
<html lang="{{ page.lang | default: site.lang | default: 'en' }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url={{ page.redirect_to }}">
  <link rel="canonical" href="{{ page.redirect_to }}">
  <meta name="robots" content="noindex, follow">
  <title>Redirecting…</title>
</head>
<body>
  <p>This post has moved to <a href="{{ page.redirect_to }}">{{ page.redirect_to }}</a>.</p>
</body>
</html>
`;

// Rewrite a post's frontmatter: layout -> redirect, inject/refresh redirect_to.
// Everything else (title, tags, ref, body) is preserved.
function toRedirect(raw, target) {
  if (!raw.startsWith('---')) return null;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = raw.slice(3, end).replace(/^\r?\n/, '');
  const rest = raw.slice(end); // starts at "\n---"

  const out = [];
  let sawLayout = false;
  for (const line of fm.split(/\r?\n/)) {
    if (/^redirect_to:/.test(line)) continue; // drop stale target, re-added below
    if (/^layout:/.test(line)) { out.push('layout: redirect'); sawLayout = true; continue; }
    out.push(line);
  }
  if (!sawLayout) out.unshift('layout: redirect');
  out.push(`redirect_to: ${target}`);
  return `---\n${out.join('\n').replace(/\n+$/, '')}\n${rest.replace(/^\n/, '\n')}`;
}

async function run() {
  let total = 0, skipped = 0, written = 0;
  for (const { lang, dir } of REPOS) {
    const postsDir = path.join(dir, '_posts');
    if (!existsSync(postsDir)) { console.error(`Missing: ${postsDir}`); continue; }
    const files = (await readdir(postsDir, { withFileTypes: true }))
      .filter((d) => d.isFile() && d.name.endsWith('.md'))
      .map((d) => d.name);

    // Only redirect posts that were actually PUBLISHED on the old site, i.e.
    // git-tracked. Untracked working-tree drafts were never live there (and are
    // migrated to the new site already) — never touch them.
    const tracked = new Set(
      execFileSync('git', ['ls-files', '_posts'], { cwd: dir, encoding: 'utf8' })
        .split('\n').map((p) => path.basename(p.trim())).filter(Boolean),
    );

    let repoWritten = 0, repoSkip = 0;
    for (const file of files) {
      if (!tracked.has(file)) { repoSkip++; continue; }  // untracked draft
      const stem = file.replace(/\.md$/, '');
      const m = stem.match(DATE_RE);
      if (!m) { repoSkip++; continue; }              // no date prefix
      const raw = await readFile(path.join(postsDir, file), 'utf8');
      // Skip empty-slug / empty-title draft stubs (never migrated).
      if (!m[2] || !/^title:\s*\S/m.test(raw)) { repoSkip++; continue; }
      const target = `${TARGET_BASE}/${lang}/blog/${stem}/`;
      const next = toRedirect(raw, target);
      if (!next) { repoSkip++; continue; }
      if (WRITE) await writeFile(path.join(postsDir, file), next, 'utf8');
      repoWritten++;
    }
    if (WRITE) await writeFile(path.join(dir, '_layouts', 'redirect.html'), REDIRECT_LAYOUT, 'utf8');
    total += files.length; written += repoWritten; skipped += repoSkip;
    console.log(`${lang}: ${repoWritten} stubs, ${repoSkip} skipped (of ${files.length}) -> ${TARGET_BASE}/${lang}/blog/<stem>/`);
  }
  console.log(`Total ${written} stubs, ${skipped} skipped, ${total} files.${WRITE ? '' : '  (dry run — pass --write)'}`);
}

run().catch((e) => { console.error(e); process.exitCode = 1; });

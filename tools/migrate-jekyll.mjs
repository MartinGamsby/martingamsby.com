#!/usr/bin/env node
// Phase 2 migration: convert the two Jekyll "Gamsblurbs" blogs into the unified
// bilingual Astro content collection.
//
//   FR source: ../martingamsby.github.io/_posts
//   EN source: ../martingamsby.gitbub.io_en/_posts   (folder-name typo is real)
//   ->         src/content/blog/{fr,en}/<YYYY-MM-DD>-<slug>.md
//
// What it does
//   - Parses Jekyll frontmatter (title, tags, categories, excerpt_image, ref).
//   - Pairs FR<->EN twins via the `ref:` URL (primary) then date (fallback),
//     and stamps a shared `translationKey` (= <date>-<EN slug>, EN-anchored).
//   - First-pass facet tagging from the Jekyll tags (heuristic — FLAGGED for
//     manual review; the door taxonomy is dev|physics|fiction|music|ideas).
//   - Drops the leading `### **Title**` body heading (the layout renders it).
//   - Maps `excerpt_image` -> `image:`; keeps `Gamsblurb`-style tags, drops the
//     `Length: …`/`Longueur: …` categories.
//   - Preserves the post body byte-for-byte otherwise (never machine-rewrite).
//
// Usage
//   node tools/migrate-jekyll.mjs            # dry run: writes only the report
//   node tools/migrate-jekyll.mjs --write    # actually write the .md files
//
// Re-runnable: with --write it clears src/content/blog/{fr,en} first so the
// collection is always a clean mirror of the (read-only) Jekyll sources.

import { readdir, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const ghRoot = path.resolve(siteRoot, '..');

const SOURCES = {
  fr: path.join(ghRoot, 'martingamsby.github.io', '_posts'),
  en: path.join(ghRoot, 'martingamsby.gitbub.io_en', '_posts'),
};
const OUT = {
  fr: path.join(siteRoot, 'src', 'content', 'blog', 'fr'),
  en: path.join(siteRoot, 'src', 'content', 'blog', 'en'),
};

const WRITE = process.argv.includes('--write');

// ---------------------------------------------------------------------------
// Facet heuristic. Keyword -> facet, matched (accent/space-insensitive) against
// the Jekyll tags + title. A post can earn several facets; if none match it
// falls back to `ideas` (the blog is mostly personal-development musings).
// This is a FIRST PASS — every assignment needs a human eye (see the report).
const FACET_KEYWORDS = {
  physics: ['science', 'physique', 'physics', 'astrophysique', 'astrophysics',
    'energie sombre', 'energie noire', 'dark energy', 'dark flow', 'flot sombre',
    'trou noir', 'black hole', 'big bang', 'cosmologie', 'cosmology', 'quantique',
    'quantum', 'gravite', 'gravity', 'supernova', 'relativite', 'univers',
    'universe', 'mathematicien', 'mathematician', 'chiffres', 'hawking'],
  dev: ['programmation', 'programming', 'logiciel', 'software', 'code', 'coding',
    'coder', 'algorithme', 'algorithm', 'developpement', 'developer', 'ia', 'ai',
    'intelligence artificielle', 'artificial intelligence', 'machine learning',
    'llm', 'informatique', 'excel', 'crypto', 'bitcoin', 'web', 'jeu video',
    'video game', 'tech', 'technologie', 'quantum computing'],
  music: ['musique', 'music', 'piano', 'composition', 'chanson', 'song', 'youtube',
    'experience musicale', 'musical experience', 'melodie', 'melody', 'microphone'],
  fiction: ['fiction', 'histoire courte', 'short story', 'nouvelle', 'roman',
    'novel', 'recit', 'defi decriture', 'writing challenge', 'larche de centauri',
    'centauri ark', 'conte', 'interverti', 'guide pour', 'djosh', 'fabulateur',
    'fabulator', 'personnage'],
};

const FACET_ORDER = ['dev', 'physics', 'fiction', 'music', 'ideas'];

// ---------------------------------------------------------------------------
// Helpers

const stripAccents = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const norm = (s) => stripAccents(String(s).toLowerCase()).replace(/\s+/g, ' ').trim();

// Slugify the EN title the same way Jekyll/the site does, as a fallback when a
// filename stem is unavailable. (Filename stems are preferred; see deriveSlug.)
const slugify = (s) =>
  stripAccents(String(s).toLowerCase())
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.*)$/;

function parseFilename(file) {
  const stem = file.replace(/\.md$/, '');
  const m = stem.match(DATE_RE);
  if (!m) return null;
  return { date: m[1], slug: m[2], stem };
}

// Parse the simple Jekyll frontmatter. The fields here are flat `key: value`
// plus two flow arrays (`tags`, `categories`); a hand parse is safer than YAML
// because titles routinely contain colons, quotes and accented punctuation.
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: raw };
  const fmBlock = raw.slice(3, end).replace(/^\r?\n/, '');
  // Body starts after the closing `---` line.
  let body = raw.slice(end + 4);
  body = body.replace(/^[^\n]*\n/, ''); // drop the rest of the `---` line
  if (body.startsWith('\n')) body = body.slice(1);

  const data = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_]+):\s?(.*)$/);
    if (!m) continue;
    const [, key, valRaw] = m;
    let val = valRaw.trim();
    if (key === 'tags' || key === 'categories') {
      val = val.replace(/^\[/, '').replace(/\]$/, '');
      data[key] = val
        .split(',')
        .map((t) => t.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = val.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body };
}

// Last path segment of a Jekyll `ref:` URL = the twin's filename stem minus date.
function refSlug(ref) {
  if (!ref) return null;
  const cleaned = ref.trim().replace(/\/+$/, '');
  if (!cleaned) return null;
  const seg = cleaned.split('/').pop();
  return seg || null;
}

// Drop the leading `### **Title**` heading the old theme duplicated, plus the
// blank lines that followed it. Everything else is preserved verbatim.
function stripTitleHeading(body) {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length && /^#{1,4}\s+\*{0,2}.*\*{0,2}\s*$/.test(lines[i])) {
    i++;
    while (i < lines.length && lines[i].trim() === '') i++;
    return lines.slice(i).join('\n');
  }
  return body;
}

// Precompile word-boundary matchers so short keywords (ai, ia, web) don't match
// inside unrelated words ("afraid", "média"). Boundaries are non-alphanumerics on
// the accent-stripped lowercased haystack.
const FACET_MATCHERS = Object.fromEntries(
  Object.entries(FACET_KEYWORDS).map(([facet, keys]) => [
    facet,
    keys.map((k) => new RegExp(`(^|[^a-z0-9])${norm(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)),
  ]),
);

function pickFacets(tags, title) {
  const hay = norm([...(tags || []), title || ''].join(' | '));
  const found = new Set();
  for (const [facet, matchers] of Object.entries(FACET_MATCHERS)) {
    if (matchers.some((re) => re.test(hay))) found.add(facet);
  }
  if (found.size === 0) found.add('ideas');
  return FACET_ORDER.filter((f) => found.has(f));
}

// Keep meaningful tags; drop the structural `Gamsblurb`/length labels noise?
// Per the format contract, `Gamsblurb` survives as a tag and `Length:` lives in
// `categories` (dropped). We keep tags as-is (sans the length labels, which are
// only ever in categories).
function cleanTags(tags) {
  return (tags || []).filter((t) => t && !/^Length:|^Longueur:/i.test(t));
}

function yamlString(s) {
  // Quote, escaping embedded double-quotes and backslashes.
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function renderPost({ title, date, translationKey, facets, tags, image, body }) {
  const fm = ['---'];
  fm.push(`title: ${yamlString(title)}`);
  fm.push(`date: ${date}`);
  fm.push(`translationKey: ${translationKey}`);
  fm.push(`facets: [${facets.join(', ')}]`);
  fm.push(`tags: [${tags.join(', ')}]`);
  if (image) fm.push(`image: ${image}`);
  fm.push('---');
  return fm.join('\n') + '\n\n' + body.replace(/^\n+/, '').replace(/\s+$/, '') + '\n';
}

// ---------------------------------------------------------------------------
// Load one language's posts into a map keyed by filename stem.

async function loadLang(lang) {
  const dir = SOURCES[lang];
  if (!existsSync(dir)) throw new Error(`Source not found: ${dir}`);
  const files = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => d.name);

  const posts = [];
  const skipped = [];
  for (const file of files) {
    const fn = parseFilename(file);
    if (!fn) { skipped.push({ file, reason: 'no date prefix' }); continue; }
    if (!fn.slug) { skipped.push({ file, reason: 'empty slug (draft stub)' }); continue; }
    const raw = await readFile(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    if (!data.title || !data.title.trim()) {
      skipped.push({ file, reason: 'empty title (draft stub)' });
      continue;
    }
    posts.push({
      lang,
      file,
      ...fn,
      title: data.title.trim(),
      tags: cleanTags(data.tags),
      ref: data.ref || '',
      image: (data.excerpt_image || '').trim(),
      body: stripTitleHeading(body),
    });
  }
  return { posts, skipped };
}

// ---------------------------------------------------------------------------

async function main() {
  const fr = await loadLang('fr');
  const en = await loadLang('en');

  const enByDate = new Map();
  for (const p of en.posts) {
    if (!enByDate.has(p.date)) enByDate.set(p.date, []);
    enByDate.get(p.date).push(p);
  }

  // Pairing is multi-pass and dedupes EN twins (each EN can be claimed once).
  // Some FR `ref:` URLs are copy-paste-wrong (point at a neighbouring post), so
  // we trust ref ONLY when it agrees with the date, then fall back to date, then
  // to a loose ref match. This order resolves the known bad refs to their real
  // (same-date) twins.
  const pairs = []; // { fr, en, via }
  const usedEn = new Set();
  const pairedFr = new Set();

  const matchesRef = (e, rs) => rs && (e.slug === rs || e.stem === rs);

  // Pass 1 — ref AND same date (the trustworthy signal).
  for (const f of fr.posts) {
    const rs = refSlug(f.ref);
    if (!rs) continue;
    const twin = en.posts.find((e) => !usedEn.has(e.stem) && e.date === f.date && matchesRef(e, rs));
    if (twin) { usedEn.add(twin.stem); pairedFr.add(f.file); pairs.push({ fr: f, en: twin, via: 'ref+date' }); }
  }
  // Pass 2 — same date, exactly one unclaimed EN (handles wrong-ref posts whose
  // real twin shares the date).
  for (const f of fr.posts) {
    if (pairedFr.has(f.file)) continue;
    const sameDate = (enByDate.get(f.date) || []).filter((e) => !usedEn.has(e.stem));
    if (sameDate.length === 1) {
      const twin = sameDate[0];
      usedEn.add(twin.stem); pairedFr.add(f.file); pairs.push({ fr: f, en: twin, via: 'date' });
    }
  }
  // Pass 3 — loose ref (legit date drift across languages), EN still unclaimed.
  for (const f of fr.posts) {
    if (pairedFr.has(f.file)) continue;
    const rs = refSlug(f.ref);
    if (!rs) continue;
    const twin = en.posts.find((e) => !usedEn.has(e.stem) && matchesRef(e, rs));
    if (twin) { usedEn.add(twin.stem); pairedFr.add(f.file); pairs.push({ fr: f, en: twin, via: 'ref(drift)' }); }
  }

  const frOnly = fr.posts.filter((f) => !pairedFr.has(f.file));
  const enOnly = en.posts.filter((e) => !usedEn.has(e.stem));

  // Build the output records.
  const records = []; // { lang, outName, title, date, translationKey, facets, tags, image, body }

  const addRecord = (post, translationKey, facets) => {
    records.push({
      lang: post.lang,
      outName: `${post.date}-${post.slug}.md`,
      title: post.title,
      date: post.date,
      translationKey,
      facets,
      tags: post.tags,
      image: post.image,
      body: post.body,
    });
  };

  for (const { fr: f, en: e } of pairs) {
    const key = `${e.date}-${e.slug}`; // EN-anchored, sticky pairing key
    const facets = pickFacets([...f.tags, ...e.tags], `${f.title} ${e.title}`);
    addRecord(f, key, facets);
    addRecord(e, key, facets);
  }
  for (const f of frOnly) {
    addRecord(f, `${f.date}-${f.slug}`, pickFacets(f.tags, f.title));
  }
  for (const e of enOnly) {
    addRecord(e, `${e.date}-${e.slug}`, pickFacets(e.tags, e.title));
  }

  // Detect duplicate output names within a language (would clobber on disk).
  const seen = new Map();
  const collisions = [];
  for (const r of records) {
    const k = `${r.lang}/${r.outName}`;
    if (seen.has(k)) collisions.push(k);
    else seen.set(k, r);
  }

  // ----- Report -----
  const facetCount = {};
  for (const r of records) for (const fct of r.facets) facetCount[fct] = (facetCount[fct] || 0) + 1;

  const lines = [];
  lines.push('# Jekyll → Astro migration report');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString().slice(0, 10)} · mode: ${WRITE ? '**WRITE**' : 'dry run'}`);
  lines.push('');
  lines.push('## Counts');
  lines.push(`- FR source posts: **${fr.posts.length}** (skipped ${fr.skipped.length})`);
  lines.push(`- EN source posts: **${en.posts.length}** (skipped ${en.skipped.length})`);
  lines.push(`- Paired twins: **${pairs.length}**`);
  lines.push(`- FR-only: **${frOnly.length}** · EN-only: **${enOnly.length}**`);
  lines.push(`- Output files: **${records.length}** (FR ${records.filter(r => r.lang === 'fr').length} / EN ${records.filter(r => r.lang === 'en').length})`);
  lines.push('');
  lines.push('## Pairing method');
  const viaCount = pairs.reduce((a, p) => ((a[p.via] = (a[p.via] || 0) + 1), a), {});
  for (const [k, v] of Object.entries(viaCount)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Facet distribution (first-pass heuristic — REVIEW)');
  for (const f of FACET_ORDER) lines.push(`- ${f}: ${facetCount[f] || 0}`);
  lines.push('');
  if (collisions.length) {
    lines.push('## ⚠ Output-name collisions (same lang+filename)');
    for (const c of collisions) lines.push(`- ${c}`);
    lines.push('');
  }
  lines.push('## FR-only posts (toggle will fall back)');
  for (const f of frOnly) lines.push(`- ${f.date} · ${f.slug} — ${f.title}`);
  lines.push('');
  lines.push('## EN-only posts (toggle will fall back)');
  for (const e of enOnly) lines.push(`- ${e.date} · ${e.slug} — ${e.title}`);
  lines.push('');
  lines.push('## Skipped source files');
  for (const s of [...fr.skipped, ...en.skipped]) lines.push(`- ${s.file} — ${s.reason}`);
  lines.push('');
  lines.push('## Non-`ideas` facet assignments (spot-check these)');
  for (const r of records.filter((r) => r.lang === 'en' && !(r.facets.length === 1 && r.facets[0] === 'ideas'))) {
    lines.push(`- [${r.facets.join(', ')}] ${r.date} — ${r.title}`);
  }
  lines.push('');

  const reportPath = path.join(siteRoot, 'tools', 'migration-report.md');
  await writeFile(reportPath, lines.join('\n'), 'utf8');

  console.log(`FR ${fr.posts.length} · EN ${en.posts.length} · pairs ${pairs.length} · FR-only ${frOnly.length} · EN-only ${enOnly.length} · out ${records.length}`);
  if (collisions.length) console.log(`⚠ ${collisions.length} output-name collisions — see report`);
  console.log(`Report: ${path.relative(siteRoot, reportPath)}`);

  if (!WRITE) {
    console.log('Dry run — no .md written. Re-run with --write to emit posts.');
    return;
  }
  if (collisions.length) {
    console.error('Refusing to write: resolve output-name collisions first.');
    process.exitCode = 1;
    return;
  }

  // Clean + write.
  for (const lang of ['fr', 'en']) {
    await rm(OUT[lang], { recursive: true, force: true });
    await mkdir(OUT[lang], { recursive: true });
  }
  for (const r of records) {
    const out = renderPost(r);
    await writeFile(path.join(OUT[r.lang], r.outName), out, 'utf8');
  }
  console.log(`Wrote ${records.length} posts into src/content/blog/{fr,en}.`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

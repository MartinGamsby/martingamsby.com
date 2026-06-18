// Astro integration: emit a bare-slug redirect stub for every `aliases:` entry
// in the blog frontmatter, so old guidepour.com / guidance4.com links keep
// working after those sites are retired.
//
// guidepour.com/agnostique -> (registrar path-forward) -> martingamsby.com/agnostique
//   -> (this stub) -> /fr/blog/2016-02-01-agnostique/   (the canonical post)
//
// Runs in `astro:build:done`, NOT a postbuild npm script: CI deploys via
// withastro/action (it calls `astro build` directly), so npm lifecycle scripts
// are skipped. The hook fails the build on a duplicate alias or an alias that
// collides with a real page — old book links are immutable, so a silent clash
// must never ship.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Both languages emit martingamsby.com bare-slug stubs: FR = guidepour.com,
// EN = guidance4.com (both forward `/<slug>` -> martingamsby.com/<slug>).
// `web5` and `conferences` are printed IDENTICALLY in both books, so those two
// slugs collide. guidepour.com is live and primary, so FR WINS a cross-language
// collision (the EN stub is skipped with a warning) — guidance4.com/web5 then
// lands on the French post, with the in-page language toggle as the escape hatch.
// (For perfect per-language landing on those two, guidance4.com would need its own
// host.) Listed FR-first so FR wins. See wiki/concepts/guidepour-redirects.md.
const EMIT_LANGS = ['fr', 'en'];

function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

// Parse a `aliases: [a, b]` frontmatter line into a string[].
function parseAliases(fm) {
  const line = fm.split(/\r?\n/).find((l) => /^aliases:\s*\[/.test(l));
  if (!line) return [];
  return line
    .replace(/^aliases:\s*\[/, '')
    .replace(/\].*$/, '')
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

// { alias, target, source }[] gathered from src/content/blog/{fr,en}/*.md.
async function collectAliasTargets(blogDir) {
  const out = [];
  for (const lang of EMIT_LANGS) {
    const dir = path.join(blogDir, lang);
    let files;
    try {
      files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const file of files) {
      const raw = await readFile(path.join(dir, file), 'utf8');
      const fm = frontmatter(raw);
      if (/^draft:\s*true\b/m.test(fm)) continue; // drafts aren't built -> would 404
      const stem = file.replace(/\.md$/, '');
      for (const alias of parseAliases(fm)) {
        out.push({ alias, lang, target: `/${lang}/blog/${stem}/`, source: `${lang}/${file}` });
      }
    }
  }
  return out;
}

const stub = (target, canonical) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="noindex, follow">
  <title>Redirecting…</title>
</head>
<body>
  <p>This page has moved to <a href="${target}">${target}</a>.</p>
</body>
</html>
`;

export default function guidepourRedirects() {
  let root;
  let site;
  return {
    name: 'guidepour-redirects',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
        site = config.site;
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        const blogDir = fileURLToPath(new URL('src/content/blog/', root));
        const targets = await collectAliasTargets(blogDir);

        // Guard 1: resolve one owner per alias. A SAME-language duplicate is a real
        // bug (throw). A CROSS-language collision (FR `web5` vs EN `web5`) is
        // expected — EMIT_LANGS is FR-first, so the first (FR) owner wins and the
        // EN stub is skipped with a warning (see the header note).
        const owner = new Map();
        for (const t of targets) {
          const prev = owner.get(t.alias);
          if (!prev) { owner.set(t.alias, t); continue; }
          if (prev.lang === t.lang) {
            throw new Error(
              `guidepour-redirects: alias "${t.alias}" is claimed by both ${prev.source} and ${t.source}.`,
            );
          }
          logger.warn(`alias "${t.alias}" claimed by ${prev.lang} (${prev.source}) and ${t.lang} (${t.source}); ${prev.lang} wins.`);
        }
        const emit = [...owner.values()];

        // Guard 2: an alias must not shadow a real built page.
        const built = new Set(pages.map((p) => p.pathname.replace(/^\/+|\/+$/g, '')));
        for (const t of emit) {
          if (built.has(t.alias)) {
            throw new Error(`guidepour-redirects: alias "${t.alias}" collides with a real page.`);
          }
          // Soft check: the post the alias points at should have been built.
          if (!built.has(t.target.replace(/^\/+|\/+$/g, ''))) {
            logger.warn(`alias "${t.alias}" -> ${t.target} but that page was not built (typo? draft?).`);
          }
        }

        // Write dist/<alias>/index.html meta-refresh stubs.
        for (const t of emit) {
          const outDir = fileURLToPath(new URL(`${t.alias}/`, dir));
          await mkdir(outDir, { recursive: true });
          const canonical = site ? new URL(t.target, site).href : t.target;
          await writeFile(path.join(outDir, 'index.html'), stub(t.target, canonical), 'utf8');
        }
        logger.info(`wrote ${emit.length} alias redirect stub(s).`);
      },
    },
  };
}

/*
 * One-shot fixup: migrated post bodies still carry old Jekyll permalinks
 * (`https://martingamsby.github.io/<slug>` and `.../en/<slug>`) — most are the
 * "Basé sur"/"Based on" V2 backlinks, plus a few inline body links. Repoint each
 * to its migrated home on the live site. The old Jekyll URL slug equals the new
 * filename slug minus its date prefix, so we resolve the target by finding the
 * blog file whose name ends in `-<slug>.md`. Custom short permalinks that don't
 * follow that rule are listed in OVERRIDES.
 *
 * Run: node tools/fix-githubio-links.mjs   (idempotent — only rewrites the old host)
 */
import { readdir as _r } from 'node:fs';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BLOG = join(ROOT, 'src', 'content', 'blog');
const SITE = 'https://martingamsby.com';

// Old short permalinks whose slug differs from the migrated filename slug.
const OVERRIDES = {
  'court-adaptation': '2024-08-30-les-parents-sadaptent', // FR "Longueur: Court" alias
};

const filesByLang = {
  fr: readdirSync(join(BLOG, 'fr')),
  en: readdirSync(join(BLOG, 'en')),
};

function resolveTarget(lang, slug) {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  const hit = filesByLang[lang].find((f) => f === `${slug}.md` || f.endsWith(`-${slug}.md`));
  return hit ? hit.replace(/\.md$/, '') : null;
}

// martingamsby.github.io/<slug>  or  martingamsby.github.io/en/<slug>
const RE = /https?:\/\/martingamsby\.github\.io\/(en\/)?([a-z0-9-]+)/g;

let changed = 0;
const unresolved = [];
for (const lang of ['fr', 'en']) {
  for (const name of filesByLang[lang]) {
    const path = join(BLOG, lang, name);
    const src = readFileSync(path, 'utf8');
    const out = src.replace(RE, (full, enPrefix, slug) => {
      const targetLang = enPrefix ? 'en' : 'fr';
      const file = resolveTarget(targetLang, slug);
      if (!file) {
        unresolved.push(`${lang}/${name}: ${full}`);
        return full;
      }
      return `${SITE}/${targetLang}/blog/${file}/`;
    });
    if (out !== src) {
      writeFileSync(path, out);
      changed++;
      console.log(`fixed ${lang}/${name}`);
    }
  }
}

console.log(`\n${changed} file(s) rewritten.`);
if (unresolved.length) {
  console.log(`\n${unresolved.length} UNRESOLVED (left as-is):`);
  unresolved.forEach((u) => console.log('  ' + u));
}

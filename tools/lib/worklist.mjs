// Build the popularity "worklist" — one row per readable social link in a post's
// footer — straight from the post .md files. Every post written by WriterHelper
// ends with a link list after a horizontal rule, e.g.
//
//   ---
//
//   - [X/Twitter](https://x.com/.../status/123)
//   - [Typeshare](https://typeshare.co/.../posts/slug)
//
// Each line is a place the post was published; the /popularity skill visits each
// `url`, reads its engagement, and feeds it back via `fetch-popularity.mjs --import`.
// Reference slots (Source / Based on / Basé sur) point at someone else's page, not
// our post, so they're skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BLOG = path.join(root, 'src', 'content', 'blog');

const SKIP_LABELS = new Set(['source', 'based on', 'basé sur', 'base sur']);

const field = (fm, k) =>
  fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');

/**
 * @param {{platform?: string|string[], hl?: string|string[]}} [filter]
 * @returns {{translationKey:string, hl:string, platform:string, url:string, title:string, date:string}[]}
 */
export function collectWorklist({ platform, hl } = {}) {
  const wantPlatform = platform ? new Set([].concat(platform).map((s) => s.toLowerCase())) : null;
  const wantHl = hl ? new Set([].concat(hl)) : null;
  const rows = [];
  for (const lang of ['fr', 'en']) {
    if (wantHl && !wantHl.has(lang)) continue;
    const dir = path.join(BLOG, lang);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md')) continue;
      const raw = fs.readFileSync(path.join(dir, name), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!m) continue;
      const [, fm, body] = m;
      if (field(fm, 'draft') === 'true') continue;
      const translationKey = field(fm, 'translationKey') || name.replace(/\.md$/, '');
      const title = field(fm, 'title') || name;
      const date = field(fm, 'date') || '0000-00-00';
      // The footer is the chunk after the LAST horizontal rule in the body.
      const parts = body.split(/\r?\n---\r?\n/);
      const footer = parts.length > 1 ? parts[parts.length - 1] : '';
      for (const lm of footer.matchAll(/^-\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gm)) {
        const label = lm[1].trim();
        if (SKIP_LABELS.has(label.toLowerCase())) continue;
        if (wantPlatform && !wantPlatform.has(label.toLowerCase())) continue;
        rows.push({ translationKey, hl: lang, platform: label, url: lm[2], title, date });
      }
    }
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows;
}

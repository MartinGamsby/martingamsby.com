// Maintain src/data/post-popularity.json — the "db" that decides which post each
// home gate features as a star. Run on demand (never on commit):
//
//   npm run fetch-popularity            # the works: seed + auto-fetch YouTube views + show standings
//   npm run fetch-popularity -- --list  # just print each gate's candidates + current star
//   npm run fetch-popularity -- --seed  # just scaffold an entry for every post
//   npm run fetch-popularity -- --dry-run   # do everything but don't write the file
//   npm run fetch-popularity -- --offline   # skip the network (seed + list only)
//
// WHAT THE DEFAULT RUN DOES (no flags), all without any API key:
//   1. seeds a {score:0,title} entry for every post that doesn't have one;
//   2. harvests video IDs from your YouTube channels (see CHANNELS), scrapes each
//      video's public view count, and matches it to a post BY TITLE;
//   3. writes the views into `sources.ytView` (+ `links.youtube`) and recomputes
//      score = (manual||0) + Σ(sources × WEIGHTS), unless a numeric `pin` overrides;
//   4. prints the standings. So "most viewed on YouTube" floats to each gate's star.
// Posts with no matching video keep score 0 → fall back to most-recent-with-image.
// Bluesky engagement is ~0 here so it's not auto-scored, but an explicit
// `links.bluesky` is still fetched. Typeshare/FB/X have no free API → hand-score
// (just edit `score`). Hand-edited `manual`/`pin`/`score` always survive a re-run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(root, 'src', 'data', 'post-popularity.json');
const BLOG = path.join(root, 'src', 'content', 'blog');

// What each raw count is worth. ytView=1 → score ≈ total YouTube views. Tune freely.
const WEIGHTS = { ytView: 1, ytLike: 10, bskyLike: 3, bskyRepost: 5 };

// Gates are lenses over facets (mirror of src/lib/featured.ts GATE_FACET).
const GATE_FACET = { book: 'fiction', dev: 'dev', music: 'music', physics: 'physics', everything: null };
const GATES = Object.keys(GATE_FACET);

// YouTube channels whose uploads accompany blog posts (source of truth:
// src/data/socials.ts). The /videos page HTML lists each upload's id; we scrape
// view counts per video, no API key. Only list channels that mirror blog posts —
// the "Music YouTube" channel (UCX6KsvwOo2U2zrBumOL2bww) is pure music/covers
// with no blog companions, so it's intentionally left out (re-add if that changes).
const CHANNELS = [
  'https://www.youtube.com/@MartinGamsby/videos',
  'https://www.youtube.com/@MartinGamsbyEN/videos',
];
const BSKY = 'https://public.api.bsky.app/xrpc';
// Bluesky handles (src/data/socials.ts) — used only to discover MORE YouTube
// video links than the channel /videos page exposes (it caps at ~30 recent).
const BSKY_HANDLES = ['martingamsby.bsky.social', 'martin-gamsby.bsky.social'];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const offline = args.has('--offline');
if (args.has('--help') || args.has('-h')) {
  console.log('Usage: node tools/fetch-popularity.mjs [--list | --seed | --dry-run | --offline]\n' +
    '  (no flags)  seed missing entries + auto-fetch YouTube views + print standings\n' +
    '  --list      print each gate\'s candidates and current ★ star\n' +
    '  --seed      scaffold an entry (score 0) for every post\n' +
    '  --dry-run   do the work but do not write the file\n' +
    '  --offline   skip the network (seed + list only)');
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
const scoreOf = (tk) => (typeof data[tk]?.score === 'number' ? data[tk].score : 0);
const write = () => fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

// --- text helpers ---------------------------------------------------------
const decode = (s = '') => s
  .replace(/&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const norm = (s = '') => decode(s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// --- read posts off disk (no Astro runtime here) --------------------------
function readPosts() {
  const posts = [];
  for (const lang of ['fr', 'en']) {
    const dir = path.join(BLOG, lang);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md')) continue;
      const fm = fs.readFileSync(path.join(dir, name), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) continue;
      const field = (k) => fm[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
      if (field('draft') === 'true') continue;
      posts.push({
        lang,
        title: field('title') || name,
        date: field('date') || '0000-00-00',
        translationKey: field('translationKey') || name.replace(/\.md$/, ''),
        facets: (field('facets') || '').replace(/[[\]]/g, '').split(',').map((s) => s.trim()).filter(Boolean),
        hasImage: /^image:\s*\S/m.test(fm[1]),
      });
    }
  }
  return posts;
}

// title → translationKey, for matching scraped video titles to posts (both langs)
function titleIndex(posts) {
  const exact = new Map();
  const list = [];
  for (const p of posts) {
    const n = norm(p.title);
    if (!n) continue;
    exact.set(n, p.translationKey);
    list.push([n, p.translationKey]);
  }
  return { exact, list };
}
function matchTitle(videoTitle, index) {
  const v = norm(videoTitle);
  if (!v) return null;
  if (index.exact.has(v)) return index.exact.get(v);
  // YouTube titles are often the post title plus/minus a trailing clause — accept
  // a prefix match either direction, but only for titles long enough to be safe.
  for (const [pt, tk] of index.list) {
    if (pt.length < 15) continue;
    if (v.startsWith(pt + ' ') || pt.startsWith(v + ' ')) return tk;
  }
  return null;
}

// --- seed: one entry per post --------------------------------------------
function ensureSeed(posts) {
  const byKey = new Map();
  for (const p of posts) {
    const cur = byKey.get(p.translationKey);
    if (!cur || (p.lang === 'en' && cur.lang !== 'en')) byKey.set(p.translationKey, p);
  }
  let added = 0;
  for (const [tk, p] of [...byKey].sort((a, b) => (a[1].date < b[1].date ? 1 : -1))) {
    if (data[tk]) continue;
    data[tk] = { score: 0, title: p.title };
    added++;
  }
  return added;
}

// --- list: show each gate's candidates + current star --------------------
function list(posts) {
  const seen = posts.filter((p) => p.lang === 'en');
  const used = new Set();
  for (const gate of GATES) {
    const facet = GATE_FACET[gate];
    const pool = seen
      .filter((p) => !used.has(p.translationKey) && (facet === null || p.facets.includes(facet)))
      .sort((a, b) => scoreOf(b.translationKey) - scoreOf(a.translationKey) || (b.hasImage - a.hasImage) || (a.date < b.date ? 1 : -1));
    if (!pool.length) { console.log(`\n${gate} (${facet || 'all'}): — none —`); continue; }
    used.add(pool[0].translationKey);
    console.log(`\n${gate} (${facet || 'all'}):`);
    for (const p of pool.slice(0, 5)) {
      console.log(`  ${p === pool[0] ? '★' : ' '} score ${String(scoreOf(p.translationKey)).padStart(6)} ${p.hasImage ? 'img' : '   '}  ${p.translationKey}`);
    }
  }
  console.log('\n★ = currently featured. Bump `score` (or set `pin`) in the JSON to override.');
}

// --- network: discover + scrape YouTube views ----------------------------
const getText = async (u) => (await fetch(u, { headers: { 'accept-language': 'en-US,en' } })).text();
const getJson = async (u) => { const r = await fetch(u, { headers: { accept: 'application/json' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };

async function mapLimit(items, limit, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}
const ytId = (u = '') => u.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1];
async function discoverVideoIds() {
  const ids = new Set();
  // 1. each channel's /videos page (≈30 most recent uploads)
  for (const u of CHANNELS) {
    try { for (const m of (await getText(u)).matchAll(/"videoId":"([\w-]{11})"/g)) ids.add(m[1]); }
    catch (e) { console.warn(`  ! channel ${u}: ${e.message}`); }
  }
  // 2. YouTube links Martin shared on Bluesky (reaches older videos the page omits)
  for (const handle of BSKY_HANDLES) {
    try {
      const { did } = await getJson(`${BSKY}/com.atproto.identity.resolveHandle?handle=${handle}`);
      let cursor;
      for (let page = 0; page < 6; page++) {
        const res = await getJson(`${BSKY}/app.bsky.feed.getAuthorFeed?actor=${did}&limit=100&filter=posts_no_replies${cursor ? `&cursor=${cursor}` : ''}`);
        for (const it of res.feed || []) {
          const uri = it.post?.embed?.external?.uri || it.post?.record?.embed?.external?.uri;
          const id = ytId(uri || '');
          if (id) ids.add(id);
        }
        if (!(cursor = res.cursor)) break;
      }
    } catch (e) { console.warn(`  ! bluesky ${handle}: ${e.message}`); }
  }
  return [...ids];
}
async function scrapeVideo(id) {
  try {
    const html = await getText(`https://www.youtube.com/watch?v=${id}`);
    const views = Number(html.match(/"viewCount":"(\d+)"/)?.[1]);
    const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1];
    if (!Number.isFinite(views) || !title) return null;
    return { id, title: decode(title), views };
  } catch { return null; }
}
async function fetchBsky(link) {
  let atUri = link.trim();
  if (!atUri.startsWith('at://')) {
    const m = atUri.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/);
    if (!m) throw new Error('unrecognized link');
    let [, actor, rkey] = m;
    if (!actor.startsWith('did:')) actor = (await getJson(`${BSKY}/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(actor)}`)).did;
    atUri = `at://${actor}/app.bsky.feed.post/${rkey}`;
  }
  const post = (await getJson(`${BSKY}/app.bsky.feed.getPosts?uris=${encodeURIComponent(atUri)}`)).posts?.[0];
  if (!post) throw new Error('post not found');
  return { bskyLike: post.likeCount ?? 0, bskyRepost: post.repostCount ?? 0 };
}

function recomputeScores() {
  let changed = 0;
  for (const [k, e] of Object.entries(data)) {
    if (k.startsWith('_') || !e || typeof e !== 'object') continue;
    const computed = (e.manual || 0) + Object.entries(e.sources || {}).reduce((s, [m, n]) => s + (WEIGHTS[m] || 0) * (Number(n) || 0), 0);
    const ns = typeof e.pin === 'number' ? e.pin : computed;
    if (e.score !== ns) { e.score = ns; e.updated = today; changed++; }
  }
  return changed;
}

// --- main -----------------------------------------------------------------
const posts = readPosts();

if (args.has('--list')) { list(posts); process.exit(0); }

const seeded = ensureSeed(posts);
if (args.has('--seed')) {
  console.log(`Seeded ${seeded} new entr${seeded === 1 ? 'y' : 'ies'}.`);
  if (seeded && !dryRun) write();
  process.exit(0);
}

let matched = 0, scraped = 0;
if (!offline) {
  const ids = await discoverVideoIds();
  console.log(`Discovered ${ids.length} videos across your channels; scraping view counts…`);
  const vids = (await mapLimit(ids, 8, scrapeVideo)).filter(Boolean);
  scraped = vids.length;
  const index = titleIndex(posts);
  const viewsByTk = {}, urlByTk = {};
  for (const v of vids) {
    const tk = matchTitle(v.title, index);
    if (!tk) continue;
    matched++;
    viewsByTk[tk] = (viewsByTk[tk] || 0) + v.views;
    if (!urlByTk[tk]) urlByTk[tk] = `https://youtu.be/${v.id}`;
    console.log(`  ✓ ${String(v.views).padStart(6)} views → ${tk}`);
  }
  for (const [tk, views] of Object.entries(viewsByTk)) {
    const e = (data[tk] ||= { score: 0 });
    e.sources = { ...(e.sources || {}), ytView: views };
    if (!e.links?.youtube) e.links = { ...(e.links || {}), youtube: urlByTk[tk] };
  }
  // any explicit Bluesky links the user added by hand
  for (const [k, e] of Object.entries(data)) {
    if (k.startsWith('_') || !e?.links?.bluesky) continue;
    try { e.sources = { ...(e.sources || {}), ...(await fetchBsky(e.links.bluesky)) }; }
    catch (err) { console.warn(`  ! ${k} bluesky: ${err.message}`); }
  }
}

const changed = recomputeScores();
console.log(
  `\n${seeded} seeded · ${scraped} videos scraped · ${matched} matched to posts · ${changed} scores updated.` +
  (offline ? '  (offline)' : ''),
);
if ((seeded || changed) && !dryRun) { write(); console.log(`Wrote ${path.relative(root, FILE)}.`); }
else if (seeded || changed) console.log('Dry run — no file written.');
list(posts);

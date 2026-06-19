// Maintain src/data/post-popularity.json — the "db" that decides which post each
// home gate features as a star. Run on demand (never on commit):
//
//   npm run fetch-popularity            # the works: seed + auto-fetch YouTube views + show standings
//   npm run fetch-popularity -- --list  # just print each gate's candidates + current star
//   npm run fetch-popularity -- --seed  # just scaffold an entry for every post
//   npm run fetch-popularity -- --dry-run   # do everything but don't write the file
//   npm run fetch-popularity -- --offline   # skip the network (seed + list only)
//
// WHAT THE DEFAULT RUN DOES (no flags):
//   1. seeds a {score:0,title} entry for every post that doesn't have one;
//   2. gathers your YouTube videos + their view counts, and matches each to a post
//      BY TITLE;
//   3. writes the views into `sources.ytView` (+ `links.youtube`) and recomputes
//      score = (manual||0) + Σ(sources × WEIGHTS), unless a numeric `pin` overrides;
//   4. prints the standings. So "most viewed on YouTube" floats to each gate's star.
//
// TWO YOUTUBE MODES:
//   • YOUTUBE_API_KEY set (recommended) — YouTube Data API: paginates EVERY upload
//     and batches stats (views + likes), reliably and completely.
//   • no key — best-effort scrape of the channel page (~30 recent) + Bluesky-shared
//     videos; incomplete and YouTube rate-limits (429) after a few dozen requests.
//   Get a free key: Google Cloud console → enable "YouTube Data API v3" → API key.
// Posts with no matching video keep score 0 → fall back to most-recent-with-image.
// Bluesky engagement is ~0 here so it's not auto-scored, but an explicit
// `links.bluesky` is still fetched. Typeshare/FB/X have no free API → hand-score
// (just edit `score`). Hand-edited `manual`/`pin`/`score` always survive a re-run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectWorklist } from './lib/worklist.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(root, 'src', 'data', 'post-popularity.json');
const BLOG = path.join(root, 'src', 'content', 'blog');

// What each raw count is worth. ytView=1 → score ≈ total YouTube views. Tune freely.
// xView=1 mirrors ytView (an X impression counts like a YouTube view); X engagement
// weights mirror Bluesky's. X/Twitter (and other login-walled platforms) can't be
// auto-fetched here — the /popularity skill reads them via the browser and feeds
// them in with `--import` (see below).
const WEIGHTS = { ytView: 1, ytLike: 10, bskyLike: 3, bskyRepost: 5, xView: 1, xLike: 10, xRepost: 5 };

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

const argv = process.argv.slice(2);
const args = new Set(argv);
const dryRun = args.has('--dry-run');
const offline = args.has('--offline');
// valued options: `--import file`, repeatable `--platform x --hl en`
const optVal = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const optVals = (flag) => argv.flatMap((a, i) => (a === flag ? [argv[i + 1]] : [])).filter(Boolean);
if (args.has('--help') || args.has('-h')) {
  console.log('Usage: [YOUTUBE_API_KEY=…] node tools/fetch-popularity.mjs [mode]\n' +
    '  (no flags)        seed missing entries + auto-fetch YouTube views + print standings\n' +
    '  --list            print each gate\'s candidates and current ★ star\n' +
    '  --seed            scaffold an entry (score 0) for every post\n' +
    '  --worklist [--platform X/Twitter] [--hl en]\n' +
    '                    print the social-link worklist (JSON) the /popularity skill sweeps\n' +
    '  --import <file>   merge browser-read readings ([{translationKey,sources,links?}])\n' +
    '                    into post-popularity.json and recompute scores\n' +
    '  --dry-run         do the work but do not write the file\n' +
    '  --offline         skip the network (seed + list only)\n' +
    '  Set YOUTUBE_API_KEY for complete, reliable coverage (all uploads + likes);\n' +
    '  without it, YouTube is scraped best-effort (~30 recent + Bluesky, rate-limited).');
  process.exit(0);
}

// --worklist: enumerate readable social links from post footers (no network, no
// file write). Repeatable --platform / --hl narrow the run. Drives the skill sweep.
if (args.has('--worklist')) {
  const platform = optVals('--platform');
  const hl = optVals('--hl');
  console.log(JSON.stringify(
    collectWorklist({ platform: platform.length ? platform : undefined, hl: hl.length ? hl : undefined }),
    null, 2,
  ));
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
// A desktop UA matters: without it YouTube serves a lighter page that omits the
// innertube key/continuation token we need to paginate a channel's full uploads.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const getText = async (u) => (await fetch(u, { headers: { 'accept-language': 'en-US,en', 'user-agent': UA } })).text();
const getJson = async (u) => { const r = await fetch(u, { headers: { accept: 'application/json' } }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); };

async function mapLimit(items, limit, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}
const ytId = (u = '') => u.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/)?.[1];

// Pull EVERY upload's id from a channel. The /videos page HTML only carries the
// first ~30; the rest come from YouTube's internal "innertube" browse endpoint
// via a continuation token (no API key — uses the public web key in the page).
// Stops when a page adds no new ids (so a stray non-video continuation can't loop).
// Video ids show up as "videoId" (classic renderers) or "contentId" (the newer
// lockupViewModel grid the continuation returns) — capture both.
const VID_RE = /"(?:videoId|contentId)":"([\w-]{11})"/g;
async function channelVideoIds(url) {
  const ids = new Set();
  const html = await getText(url);
  for (const m of html.matchAll(VID_RE)) ids.add(m[1]);
  const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1]
    || html.match(/"clientVersion":"([\d.]+)"/)?.[1];
  let token = html.match(/"continuationCommand":\{"token":"([^"]+)"/)?.[1];
  for (let page = 0; token && key && clientVersion && page < 25; page++) {
    let body;
    try {
      const r = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion } }, continuation: token }),
      });
      body = await r.text();
    } catch { break; }
    const before = ids.size;
    for (const m of body.matchAll(VID_RE)) ids.add(m[1]);
    if (ids.size === before) break; // no new videos → done (ignore stray continuations)
    token = body.match(/"continuationCommand":\{"token":"([^"]+)"/)?.[1];
  }
  return ids;
}

// YouTube video links Martin shared on Bluesky — supplements channel discovery.
async function discoverBskyIds() {
  const ids = new Set();
  for (const handle of BSKY_HANDLES) {
    try {
      const { did } = await getJson(`${BSKY}/com.atproto.identity.resolveHandle?handle=${handle}`);
      let cursor;
      for (let page = 0; page < 6; page++) {
        const res = await getJson(`${BSKY}/app.bsky.feed.getAuthorFeed?actor=${did}&limit=100&filter=posts_no_replies${cursor ? `&cursor=${cursor}` : ''}`);
        for (const it of res.feed || []) {
          const id = ytId(it.post?.embed?.external?.uri || it.post?.record?.embed?.external?.uri || '');
          if (id) ids.add(id);
        }
        if (!(cursor = res.cursor)) break;
      }
    } catch (e) { console.warn(`  ! bluesky ${handle}: ${e.message}`); }
  }
  return ids;
}

// No-key path: scrape one video's view count off its watch page. Best-effort —
// YouTube rate-limits (HTTP 429) after a few dozen rapid requests.
async function scrapeVideo(id) {
  try {
    const html = await getText(`https://www.youtube.com/watch?v=${id}`);
    const views = Number(html.match(/"viewCount":"(\d+)"/)?.[1]);
    const title = html.match(/<meta name="title" content="([^"]*)"/)?.[1];
    if (!Number.isFinite(views) || !title) return null;
    return { id, title: decode(title), views };
  } catch { return null; }
}

// --- YouTube Data API path (set YOUTUBE_API_KEY) --------------------------
// The robust route: paginates EVERY upload and batches stats 50-at-a-time, so a
// 60-video channel is ~2 requests (no scraping, no rate-limit, includes likes).
const YT = 'https://www.googleapis.com/youtube/v3';
async function channelUploadsApi(key) {
  const ids = [];
  for (const u of CHANNELS) {
    try {
      const handle = u.match(/@([^/]+)/)?.[1];
      const cid = u.match(/channel\/(UC[\w-]+)/)?.[1];
      const ch = await getJson(`${YT}/channels?part=contentDetails&${handle ? `forHandle=${handle}` : `id=${cid}`}&key=${key}`);
      const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploads) { console.warn(`  ! no uploads playlist for ${u}`); continue; }
      let pageToken;
      do {
        const pl = await getJson(`${YT}/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${key}`);
        for (const it of pl.items || []) ids.push(it.contentDetails.videoId);
        pageToken = pl.nextPageToken;
      } while (pageToken);
    } catch (e) { console.warn(`  ! channel API ${u}: ${e.message}`); }
  }
  return ids;
}
async function videoStatsApi(key, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    try {
      const res = await getJson(`${YT}/videos?part=snippet,statistics&id=${ids.slice(i, i + 50).join(',')}&key=${key}`);
      for (const it of res.items || []) out.push({
        id: it.id, title: decode(it.snippet.title),
        views: Number(it.statistics?.viewCount || 0), likes: Number(it.statistics?.likeCount || 0),
      });
    } catch (e) { console.warn(`  ! videos API: ${e.message}`); }
  }
  return out;
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

// --import <file>: fold browser-read readings (from the /popularity skill) into
// `sources` and recompute. File shape: [{translationKey, sources:{xView,…}, links?}].
// Manual/pin still win; this is just another sources contributor like ytView.
const importFile = optVal('--import');
if (importFile) {
  const readings = JSON.parse(fs.readFileSync(importFile, 'utf8'));
  ensureSeed(posts); // so a brand-new post still has an entry to merge into
  let merged = 0;
  const missing = [];
  for (const r of Array.isArray(readings) ? readings : []) {
    const tk = r?.translationKey;
    if (!tk) continue;
    const e = data[tk];
    if (!e || typeof e !== 'object') { missing.push(tk); continue; }
    if (r.sources) e.sources = { ...(e.sources || {}), ...r.sources };
    if (r.links) e.links = { ...(e.links || {}), ...r.links };
    merged++;
  }
  const changed = recomputeScores();
  console.log(`Imported ${merged} reading${merged === 1 ? '' : 's'} · ${changed} score${changed === 1 ? '' : 's'} updated` +
    (missing.length ? `\n  ! no post-popularity entry for: ${missing.join(', ')}` : ''));
  if (!dryRun) { write(); console.log(`Wrote ${path.relative(root, FILE)}.`); }
  else console.log('Dry run — no file written.');
  list(posts);
  process.exit(0);
}

const seeded = ensureSeed(posts);
if (args.has('--seed')) {
  console.log(`Seeded ${seeded} new entr${seeded === 1 ? 'y' : 'ies'}.`);
  if (seeded && !dryRun) write();
  process.exit(0);
}

const ytKey = process.env.YOUTUBE_API_KEY;
let matched = 0, videoCount = 0;
if (!offline) {
  const bskyIds = await discoverBskyIds();
  let videos; // [{ id, title, views, likes }]
  if (ytKey) {
    const ids = [...new Set([...(await channelUploadsApi(ytKey)), ...bskyIds])];
    console.log(`YouTube Data API: ${ids.length} videos across your channels; fetching stats…`);
    videos = await videoStatsApi(ytKey, ids);
  } else {
    const chIds = new Set();
    for (const u of CHANNELS) {
      try { for (const id of await channelVideoIds(u)) chIds.add(id); }
      catch (e) { console.warn(`  ! channel ${u}: ${e.message}`); }
    }
    const ids = [...new Set([...chIds, ...bskyIds])];
    console.log(`Discovered ${ids.length} videos (no API key — scraping view counts, best-effort)…`);
    videos = (await mapLimit(ids, 5, scrapeVideo)).filter(Boolean);
    if (videos.length < ids.length) {
      console.warn(`  (only ${videos.length}/${ids.length} scraped — YouTube rate-limits without a key. ` +
        `Set YOUTUBE_API_KEY for complete, reliable results + likes.)`);
    }
  }
  videoCount = videos.length;

  const index = titleIndex(posts);
  const viewsByTk = {}, likesByTk = {}, urlByTk = {};
  for (const v of videos) {
    const tk = matchTitle(v.title, index);
    if (!tk) continue;
    matched++;
    viewsByTk[tk] = (viewsByTk[tk] || 0) + v.views;
    if (v.likes) likesByTk[tk] = (likesByTk[tk] || 0) + v.likes;
    if (!urlByTk[tk]) urlByTk[tk] = `https://youtu.be/${v.id}`;
    console.log(`  ✓ ${String(v.views).padStart(6)} views → ${tk}`);
  }
  for (const tk of Object.keys(viewsByTk)) {
    const e = (data[tk] ||= { score: 0 });
    e.sources = { ...(e.sources || {}), ytView: viewsByTk[tk] };
    if (likesByTk[tk]) e.sources.ytLike = likesByTk[tk];
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
  `\n${seeded} seeded · ${videoCount} videos${ytKey ? '' : ' scraped'} · ${matched} matched to posts · ${changed} scores updated.` +
  (offline ? '  (offline)' : ytKey ? '  (YouTube Data API)' : ''),
);
if ((seeded || changed) && !dryRun) { write(); console.log(`Wrote ${path.relative(root, FILE)}.`); }
else if (seeded || changed) console.log('Dry run — no file written.');
list(posts);

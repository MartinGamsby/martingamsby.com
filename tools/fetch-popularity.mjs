// Refresh src/data/post-popularity.json from the platforms that expose a usable
// public read API: Bluesky (likes + reposts, no auth) and YouTube (views +
// likes, needs an API key). It's a HELPER, run on demand — never on commit:
//
//   node tools/fetch-popularity.mjs            # update scores from existing links
//   node tools/fetch-popularity.mjs --dry-run  # show what would change, write nothing
//   YOUTUBE_API_KEY=... node tools/fetch-popularity.mjs   # include YouTube
//
// It only touches entries that carry a `links` map, e.g. add to a post's entry:
//   "links": { "bluesky": "https://bsky.app/profile/<handle>/post/<rkey>",
//              "youtube": "https://youtu.be/<id>" }
// then re-run. For each linked entry it writes raw counts into `sources` and
// recomputes  score = (manual||0) + Σ(sources × WEIGHTS)  — UNLESS the entry has
// a numeric `pin`, which hard-overrides score and is left alone. Entries without
// links (hand-scored ones) are preserved untouched. Platforms with no clean free
// API (Typeshare, Facebook, X/Twitter) are score-by-hand only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(root, 'src', 'data', 'post-popularity.json');

// How much each raw count is worth, so different platforms/metrics combine into
// one comparable score. Tune freely — these are deliberately simple.
const WEIGHTS = {
  bskyLike: 3,
  bskyRepost: 5,
  ytView: 1,
  ytLike: 10,
};

const BSKY = 'https://public.api.bsky.app/xrpc';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const help = args.has('--help') || args.has('-h');

if (help) {
  console.log(
    'Usage: [YOUTUBE_API_KEY=...] node tools/fetch-popularity.mjs [--dry-run]\n' +
      'Updates src/data/post-popularity.json from Bluesky + YouTube for entries that have a `links` map.',
  );
  process.exit(0);
}

async function getJson(u) {
  const r = await fetch(u, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${u}`);
  return r.json();
}

// --- Bluesky --------------------------------------------------------------
// Accepts an at:// uri or a bsky.app post URL; returns likes + reposts.
async function fetchBsky(link) {
  let atUri = link.trim();
  if (!atUri.startsWith('at://')) {
    const m = atUri.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/?#]+)/);
    if (!m) throw new Error(`unrecognized Bluesky link: ${link}`);
    let [, actor, rkey] = m;
    if (!actor.startsWith('did:')) {
      const res = await getJson(`${BSKY}/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(actor)}`);
      actor = res.did;
    }
    atUri = `at://${actor}/app.bsky.feed.post/${rkey}`;
  }
  const res = await getJson(`${BSKY}/app.bsky.feed.getPosts?uris=${encodeURIComponent(atUri)}`);
  const post = res.posts?.[0];
  if (!post) throw new Error(`Bluesky post not found: ${atUri}`);
  return { likes: post.likeCount ?? 0, reposts: post.repostCount ?? 0 };
}

// --- YouTube --------------------------------------------------------------
function youTubeId(link) {
  const s = link.trim();
  if (/^[\w-]{11}$/.test(s)) return s; // bare id
  const m = s.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/);
  if (!m) throw new Error(`unrecognized YouTube link: ${link}`);
  return m[1];
}
async function fetchYouTube(link, key) {
  const id = youTubeId(link);
  const res = await getJson(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}&key=${key}`,
  );
  const stats = res.items?.[0]?.statistics;
  if (!stats) throw new Error(`YouTube video not found: ${id}`);
  return { views: Number(stats.viewCount ?? 0), likes: Number(stats.likeCount ?? 0) };
}

// --- main -----------------------------------------------------------------
const ytKey = process.env.YOUTUBE_API_KEY;
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let changed = 0;
let touched = 0;

for (const [key, entry] of Object.entries(data)) {
  if (key.startsWith('_') || !entry || typeof entry !== 'object') continue;
  if (!entry.links) continue; // hand-scored entry — leave it alone
  touched++;
  const sources = { ...(entry.sources || {}) };

  if (entry.links.bluesky) {
    try {
      const { likes, reposts } = await fetchBsky(entry.links.bluesky);
      sources.bskyLike = likes;
      sources.bskyRepost = reposts;
    } catch (e) {
      console.warn(`  ! ${key} bluesky: ${e.message}`);
    }
  }
  if (entry.links.youtube) {
    if (!ytKey) {
      console.warn(`  ! ${key} youtube: set YOUTUBE_API_KEY to fetch`);
    } else {
      try {
        const { views, likes } = await fetchYouTube(entry.links.youtube, ytKey);
        sources.ytView = views;
        sources.ytLike = likes;
      } catch (e) {
        console.warn(`  ! ${key} youtube: ${e.message}`);
      }
    }
  }

  const computed =
    (entry.manual || 0) +
    Object.entries(sources).reduce((sum, [metric, n]) => sum + (WEIGHTS[metric] || 0) * (Number(n) || 0), 0);
  const score = typeof entry.pin === 'number' ? entry.pin : computed;

  if (JSON.stringify(entry.sources) !== JSON.stringify(sources) || entry.score !== score) {
    entry.sources = sources;
    entry.score = score;
    entry.updated = new Date().toISOString().slice(0, 10);
    changed++;
    console.log(`  ~ ${key}: score=${score}`, sources);
  }
}

console.log(`\n${touched} linked entr${touched === 1 ? 'y' : 'ies'} checked, ${changed} updated.`);
if (!ytKey) console.log('(YouTube skipped — no YOUTUBE_API_KEY.)');

if (changed && !dryRun) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`Wrote ${path.relative(root, FILE)}.`);
} else if (changed) {
  console.log('Dry run — no file written.');
}

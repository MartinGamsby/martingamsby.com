---
name: popularity
description: Read engagement numbers (X/Twitter views/likes, Typeshare, Medium, LinkedIn, Facebook, Instagram…) for the blog's social posts and fold them into src/data/post-popularity.json so the homepage "featured star" per door reflects real reach. Use when the user says "/popularity", "check the popularity", "how are the posts doing", "update the engagement numbers", or wants the periodic (≈monthly) social-metrics sweep. This is read-only telemetry — it never authors or edits post content.
---

# Popularity sweep

Make the homepage stars reflect real reach. Each door ("gate") features the
highest-scored post in its facet ([[featured-stars]]); `score = manual + Σ(sources ×
WEIGHTS)`. `tools/fetch-popularity.mjs` auto-fills the platforms with a free API
(**YouTube** views/likes, **Bluesky**); everything else is login-walled and must be
**read from the operator's logged-in browser** — that's this skill. You read engagement
off each post's social links and feed it back with `--import`; the existing score formula
folds it into the star selection. Run from the repo root.

**This skill is analytics, not authoring** — authoring stays in WriterHelper. It only
writes the popularity data file, never `src/content/blog/**`.

## How it works

Every published post ends with a footer of social links (`- [X/Twitter](https://x.com/…)`).
`tools/lib/worklist.mjs` turns those into a worklist of `{translationKey, hl, platform,
url, title, date}` rows — one per readable link. You visit each `url`, read its number,
and import it as `sources.<metric>` keyed by `translationKey` (shared by FR/EN twins, so
one reading covers both). The full back-catalogue is ~470 links — **chunk by platform**
and import as you go; re-importing merges (overwrites a post's earlier `sources`, never
duplicates), so the sweep is resumable. The worklist is **incremental by default** (emits
only links not yet read for that platform); pass `--all` for a full re-pass. See Step 1.

## Preconditions

1. The Claude-for-Chrome extension is connected (`list_connected_browsers`). If not, ask
   the user to connect it — do NOT fall back to pixel-clicking.
2. The operator is logged into the platforms being swept (X, Medium, LinkedIn…) in that
   browser. A number you can't see logged-out is a **gap**, never a 0.
3. You're in the martingamsby.com repo root.
4. **Bluesky & YouTube are already automatic** — `npm run fetch-popularity` (no flags)
   handles them. Don't read those in the browser; just run the script for them.

## Steps

### 1 — Scope the run
Default highest-signal first: **X/Twitter EN** (the operator's known signal), then the
rest. Get the worklist:

```bash
npm run fetch-popularity -- --worklist --platform X/Twitter --hl en   # one chunk
npm run fetch-popularity -- --worklist                                # everything
```
`--platform` / `--hl` are repeatable; omit for all. Each row's `url` is what you open.

**The worklist is incremental by default — it only emits links not yet read.** A post
counts as "read" for a platform once any of that platform's metrics is in its `sources`
(X → `x*`, LinkedIn → `li*`), so a re-run surfaces only **new / never-read** posts and you
never re-check what's done. The command also prints a **per-platform recency summary on
stderr** — e.g. `linkedin: last full import 2026-06-19 (0d ago) · 18 links, 4 unread` /
`typeshare: never imported · 107 links, 107 unread` — read from the `_fetched` stamp (see
below). If a platform shows `0 unread`, it's up to date; skip it unless forced.

**Full re-pass with `--all`** — to re-read *every* link regardless of what's stored (a
periodic refresh of an already-swept platform, or the first pass of a brand-new one like
Typeshare):

```bash
npm run fetch-popularity -- --worklist --platform Typeshare --all     # full Typeshare pass
npm run fetch-popularity -- --worklist --platform LinkedIn --all      # re-read all LinkedIn
```

So the normal cadence is: **default** (incremental — pick up the new ones), and **`--all`**
when you deliberately want fresh numbers for a whole platform. `--import` stamps
`_fetched.<platform>` (a `_`-prefixed, scoring-ignored top-level key in
`post-popularity.json`) with the run date automatically, which is what the recency summary
reads — you don't maintain it by hand. (Only browser-read platforms are tracked there;
Bluesky/YouTube are auto-fetched and not stamped.)

### 2 — Read the numbers (browser)

**X/Twitter — deterministic via `javascript_tool`; do NOT eyeball `get_page_text`.** X's
page text doesn't surface the engagement bar and the visible UI rounds ("1.2K"). Read X's
exact `aria-label`s instead. **Critical: read the FOCAL tweet, not the first `<article>`.**
When a link is a *reply*, X stacks the parent post (someone else's, often far bigger)
above it; `querySelector('article')` grabs the parent. Select the article whose permalink
matches the URL's status ID. (Symptom of getting it wrong: an out-of-character viral
number on what's actually a reply.) `navigate` to the `url`, then run this self-polling
extractor; batch many `navigate`→extract pairs in one `browser_batch` (the poll makes the
sequencing safe):

```js
await (async () => {
  const num=(s)=>{if(s==null)return null;const m=String(s).replace(/,/g,'').match(/([\d.]+)\s*([KM]?)/i);if(!m)return null;let v=parseFloat(m[1]);if(/k/i.test(m[2]))v*=1e3;if(/m/i.test(m[2]))v*=1e6;return Math.round(v);};
  const idm=location.pathname.match(/status\/(\d+)/);const id=idm?idm[1]:null;
  const focal=()=>{const arts=[...document.querySelectorAll('article')];if(id){for(const a of arts){if(a.querySelector('a[href*="/status/'+id+'"]'))return a;}}return arts[0]||null;};
  const extract=()=>{const art=focal();if(!art)return{error:'no-article',id:id};
    const lbl=(t)=>{const e=art.querySelector('[data-testid="'+t+'"]');return e?num(e.getAttribute('aria-label')):null;};
    const g=art.querySelector('[role="group"][aria-label]');const gl=g?g.getAttribute('aria-label').replace(/,/g,''):'';
    const G=(re)=>{const m=gl.match(re);return m?num(m[1]):null;};const pick=(a,b)=>a!=null?a:b;
    return{id:id,replies:pick(lbl('reply'),G(/([\d.]+\s*[KM]?)\s*repl/i)),reposts:pick(lbl('retweet'),G(/([\d.]+\s*[KM]?)\s*repost/i)),likes:pick(lbl('like'),G(/([\d.]+\s*[KM]?)\s*like/i)),bookmarks:pick(lbl('bookmark'),G(/([\d.]+\s*[KM]?)\s*bookmark/i)),views:G(/([\d.]+\s*[KM]?)\s*view/i),raw:gl};};
  for(let i=0;i<40;i++){const art=focal();if(art){const g=art.querySelector('[role="group"][aria-label]');if(g&&/view/i.test(g.getAttribute('aria-label')||''))return extract();}await new Promise(r=>setTimeout(r,150));}
  return extract();
})()
```

`views` is the primary X signal. A `{"error":"no-article"}` result usually means the post
was **deleted** ("this page doesn't exist") — verify with `get_page_text`, then treat it
as a **gap**, not a 0. `twitter.com/user/status/<id>` URLs redirect fine to the post.

**LinkedIn — deterministic via `javascript_tool`, and the primary signal is `impressions`.**
Because the operator is logged in **as the author** (Martin), LinkedIn surfaces a per-post
**"N impressions"** headline (next to "View analytics") on every one of *his own* posts —
the LinkedIn equivalent of an X view / YouTube view, and the real-reach number we want.
It is NOT in the social-counts bar or an aria-label; read it from the page text with
`/([\d.,]+\s*[KM]?)\s*impressions?/i`. Engagement (reactions/comments/reposts) lives in the
`.social-details-social-counts` bar: reactions are in
`.social-details-social-counts__social-proof-fallback-number` (fallback: an `N reactions`
aria-label); comments/reposts are exact aria-labels (`"1 comment on … post"`, `"N reposts"`).
A post with zero engagement renders **no** counts bar — that's a real 0, not a gap (the
impression count still shows). `navigate` to the `url`, then run this self-polling extractor
(batch many `navigate`→extract pairs per `browser_batch`, but keep it to ~3 posts/batch — a
LinkedIn post is heavy and 7 navigations time the batch out):

```js
await (async () => {
  const num=(s)=>{if(s==null)return null;const m=String(s).replace(/,/g,'').match(/([\d.]+)\s*([KM]?)/i);if(!m)return null;let v=parseFloat(m[1]);if(/k/i.test(m[2]))v*=1e3;if(/m/i.test(m[2]))v*=1e6;return Math.round(v);};
  const dead=()=>/cannot be displayed|isn.t available|no longer available/i.test(document.body.innerText);
  const impT=()=>(document.body.innerText.match(/([\d.,]+\s*[KM]?)\s*impressions?\b/i)||[])[1];
  for(let i=0;i<45;i++){if(dead()||impT()||document.querySelector('.social-details-social-counts'))break;await new Promise(r=>setTimeout(r,200));}
  if(dead())return{error:'unavailable'};
  const A=[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).filter(Boolean);
  const F=(re)=>{for(const a of A){const m=a.match(re);if(m)return num(m[1]);}return null;};
  let r=null;const sp=document.querySelector('.social-details-social-counts__social-proof-fallback-number');
  if(sp)r=num(sp.innerText);if(r==null)r=F(/([\d,.KM]+)\s*reactions?\b/i);
  return{impressions:num(impT()),reactions:r,comments:F(/([\d,.KM]+)\s*comments?\b/i),reposts:F(/([\d,.KM]+)\s*reposts?\b/i)};
})()
```

Map `impressions→liImpression` (primary), `reactions→liReaction`, `comments→liComment`,
`reposts→liRepost`. An `{"error":"unavailable"}` means LinkedIn shows "This post cannot be
displayed" (deleted/restricted — several old `activity-…` and `/feed/update/urn:li:share:…`
URLs are dead) → a **gap**, never a 0. If `impressions` comes back `null` but the post
clearly rendered (its body text is present), re-poll once — it usually means the page hadn't
finished loading the analytics line yet.

**Other platforms — Claude-for-Chrome:** `navigate`, then `get_page_text`/`read_page`
(`find` if a count is buried). Capture what the page shows: Typeshare likes/comments,
Medium claps/responses, Facebook reactions/comments/shares, Instagram likes/comments.
Record only what's actually there — hidden/private = gap.

### 3 — Import readings
Build an array, one object per post you read, then import. Map each metric to its
`sources` key — X: `views→xView`, `likes→xLike`, `reposts→xRepost`; LinkedIn:
`impressions→liImpression`, `reactions→liReaction`, `comments→liComment`,
`reposts→liRepost`; other platforms get their own keys — add weights in `WEIGHTS` in
`tools/fetch-popularity.mjs`. Omit any metric that came back `null` (don't write a 0):

```json
[
  {"translationKey":"2024-09-16-an-idea-you-can-apply-to-everything-from-20-years-of-learning",
   "sources":{"xView":1062,"xLike":17},
   "links":{"x":"https://x.com/MartinGamsby_EN/status/1835761291383951494"}}
]
```
```bash
npm run fetch-popularity -- --import readings.json            # merges + recomputes scores
npm run fetch-popularity -- --import readings.json --dry-run  # preview, no write
```
A `! no post-popularity entry for: <tk>` warning means a key didn't match a post — fix the
`translationKey` (run `--seed` first if the post is brand new). Import incrementally after
each chunk — the merge keeps it safe.

### 4 — Report
```bash
npm run fetch-popularity -- --list
```
Show the operator each gate's new ★ star and the biggest movers, and call out the **gaps**
you couldn't read. Suggest the next chunk if the sweep is partial.

## Rules

- **Never fabricate a metric.** A missing/hidden/login-walled number is a gap, reported as
  such — not a 0.
- **X reply trap:** always read the focal tweet (status-ID match), never the first article.
- **LinkedIn impressions are author-only:** they show because the operator is logged in as
  the post author. The headline `N impressions` (not the social-counts bar) is the primary
  signal. "This post cannot be displayed" = a gap, not a 0.
- **Don't read Bluesky/YouTube here** — `npm run fetch-popularity` does them automatically.
- **Never touch `src/content/blog/**`** — this writes only `src/data/post-popularity.json`.
- Honour link safety: these are the operator's own posts, but verify a URL looks like the
  expected platform before navigating.
- Weights live in `WEIGHTS` (`tools/fetch-popularity.mjs`); tune there, never invent scores.
- **Incremental by default.** `--worklist` only emits never-read links and reports each
  platform's last-swept date (`_fetched`); don't re-read what's done. Use `--all` only when
  you intend a full refresh of a platform. Import auto-stamps `_fetched.<platform>`.

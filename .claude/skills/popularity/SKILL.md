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
duplicates), so the sweep is resumable.

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

**Other platforms — Claude-for-Chrome:** `navigate`, then `get_page_text`/`read_page`
(`find` if a count is buried). Capture what the page shows: Typeshare likes/comments,
Medium claps/responses, LinkedIn reactions/comments/reposts, Facebook reactions/comments/
shares, Instagram likes/comments. Record only what's actually there — hidden/private =
gap.

### 3 — Import readings
Build an array, one object per post you read, then import. Map each X metric to its
`sources` key (`views→xView`, `likes→xLike`, `reposts→xRepost`; other platforms get their
own keys — add weights in `WEIGHTS` in `tools/fetch-popularity.mjs`):

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
- **Don't read Bluesky/YouTube here** — `npm run fetch-popularity` does them automatically.
- **Never touch `src/content/blog/**`** — this writes only `src/data/post-popularity.json`.
- Honour link safety: these are the operator's own posts, but verify a URL looks like the
  expected platform before navigating.
- Weights live in `WEIGHTS` (`tools/fetch-popularity.mjs`); tune there, never invent scores.

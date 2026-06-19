# Featured post-stars (home constellation)

Each home-page door ("gate") hangs one representative blog post off itself as a
**star** in the [[doors-as-lenses]] constellation — so every door visibly anchors
real content, not just a filter. Added 2026-06-16.

## How a gate's star is chosen

`src/lib/featured.ts` → `getGateFeatures(lang, gates)` returns one post per gate,
de-duped across gates (no post features twice; `everything` is listed last so it
takes the top post the specific gates didn't claim). Per gate the candidate pool
is the posts carrying that gate's facet, sorted by:

1. **trendingScore** (desc) — recency-decayed popularity (`(score + 1) /
   (log2(ageDays/45 + 1) + 1)`), so a high-engagement post fades over time and a
   fresh post out-ranks an equal-but-older one. Same metric the related-constellation
   and tag-galaxy use;
2. **has an image** (desc) — tiebreak only (trending rarely ties);
3. **date** (desc).

So with an empty popularity table it degrades to *"most-recent post"* (recency drives
trendingScore), then prefers one with an image. Gates are lenses over facets
(`GATE_FACET`): `book → fiction`, `dev/music/physics` 1:1, `everything →` the whole
pool. (Both `src/lib/featured.ts` `getGateFeatures` and the `--list` preview in
`tools/fetch-popularity.mjs` sort by trendingScore — keep the two formulas in sync.)

## The popularity table (manual, with an optional fetch helper)

`src/data/post-popularity.json` — keyed by `translationKey` (shared by FR/EN
twins, so one score covers both; the displayed post is the current-language
twin). Keys starting with `_` are ignored (there's a `_readme`). Entry shape:

```json
"2024-10-22-burnout": { "score": 8, "manual": 8, "sources": {...}, "links": {...}, "pin": 0, "updated": "..." }
```

The site only reads `score`. Decision (Martin, 2026-06-16): **manual JSON is the
source of truth, refreshed on demand by a script — never on commit / never on a
cron.** `tools/fetch-popularity.mjs` (`npm run fetch-popularity`):

- **no flag (the default — "the works")**:
  1. seeds a `{score:0,title}` entry for every post that lacks one;
  2. **gathers YouTube videos** from the 2 blog `CHANNELS` (`@MartinGamsby`,
     `@MartinGamsbyEN`; music channel excluded) *plus* both Bluesky feeds as a
     supplemental index;
  3. **matches each video to a post by title** (normalized exact or prefix either
     direction, ≥15-char guard — so the music-cover catalogue, "Take On Me" etc.,
     correctly does NOT match any post), with its view count;
  4. writes views into `sources.ytView` (+`ytLike` in API mode, +`links.youtube`),
     then recomputes `score = (manual||0) + Σ(sources × WEIGHTS)` unless a numeric
     `pin`. A post promoted by several videos (full + Short, FR + EN) sums views.

  **Two YouTube modes (this is the important bit):**
  - **`YOUTUBE_API_KEY` set (recommended)** — YouTube Data API: `channels`→uploads
    playlist, `playlistItems` paginates **every** upload, `videos.list` batches
    stats 50-at-a-time (views **and** likes). A 60-video channel = ~2 requests.
    Complete and reliable. *(Written but not yet run with a real key — verify.)*
  - **no key** — best-effort: the channel `/videos` page only exposes ~30 recent
    (the rest need an innertube continuation token, which is **flaky/
    nondeterministic** — measured 30 one run, 59 the next), plus Bluesky-shared
    videos, then **scrapes each watch page** for views. YouTube **rate-limits
    (HTTP 429)** after a few dozen rapid requests → incomplete. **@MartinGamsby
    actually has 59 uploads but only ~30 are seen this way.** Hence the key.
- `--seed` — just scaffold entries (idempotent). **Seeded all 131 posts 2026-06-16.**
- `--list` — just print each gate's candidates with the current ★ star.
- `--dry-run` — do the work, write nothing. `--offline` — skip the network.

First real run (2026-06-16): 79 videos discovered, 9 matched → e.g. dev star
`i-tried-using-a-microphone-on-my-phone` (198 views), music
`just-a-few-hours-of-practice` (562), everything `piano-...` (86); book/physics
have no companion video so they stay on the most-recent-with-image fallback.

**Reality check.** Bluesky *engagement* is ~0 (likes/reposts) and the API exposes
**no view/impression count at all** (post fields are only like/repost/reply/quote/
bookmark — all 0), so Bluesky is used *only* as an extra **video-discovery index**
(both FR + EN feeds; the FR feed `martin-gamsby` actually yields more videos than
EN and drives most of the view totals — FR + EN uploads of the same post share a
translationKey so their views sum). The "Music YouTube" channel
(`UCX6KsvwOo2U2zrBumOL2bww`) is **excluded** — pure covers, no blog companions.

Probed every other platform 2026-06-17 to see if YouTube's trick generalizes — it
doesn't: **X/Twitter** is a JS shell (real data needs authed GraphQL, impressions
behind login + anti-bot), **Typeshare** is a client-rendered SPA with no data in
the HTML and no public API. **Facebook**: Martin has a Graph API token for a
*business Page*, but a Page token is scoped to **that Page only** — it reads the
Page's own posts + insights (incl. impressions/reach for those posts), NOT
arbitrary profiles/posts; reading other pages' public content needs "Page Public
Content Access" (app review + business verification), and personal profiles are
off-limits. Martin's blog is shared on his **personal** profile
(`facebook.com/martin.gamsby`), so the Page token only helps **if** blog content
also lives on that business Page (then `/{page}/posts` + insights would give real
reach). Otherwise it's no use here. The blog itself has no analytics. So **YouTube
view count is the only real auto-signal** in the script; Bluesky engagement is ~0.

## Browser-read platforms — the `/popularity` skill

The login-walled platforms the script can't reach (**X/Twitter** first — Martin's
known signal — then Typeshare/Medium/LinkedIn/Facebook/Instagram) are read from the
operator's **logged-in browser** by the `.claude/skills/popularity` skill (analytics,
not authoring), and folded into the same `sources`/`score`. Pipeline:

- `tools/lib/worklist.mjs` parses each post's **footer social links** (`- [X/Twitter]
  (url)` after the trailing `---`) into `{translationKey, hl, platform, url}` rows.
  `npm run fetch-popularity -- --worklist [--platform X/Twitter --hl en]` prints them.
- The skill visits each `url` via Claude-for-Chrome, reads engagement, and writes
  `[{translationKey, sources:{xView,xLike,…}, links}]`.
- `npm run fetch-popularity -- --import readings.json` merges those into `sources` and
  re-runs `recomputeScores()`. `WEIGHTS` now includes `xView:1` (an X impression
  counts like a YouTube view), `xLike:10`, `xRepost:5`.
- **X reply trap:** read the *focal* tweet (the article whose permalink matches the
  URL's status id), never the first `<article>` — a reply renders the parent post
  above it, so the first article is someone else's (much larger) numbers.

First migration (2026-06-18 sweep, 90 X readings): e.g. `an-idea-you-can-apply`
xView 1062 → score 1232 → **dev** star; `10-years` → book star; `just-a-few-hours` →
music star. Hand-edited `manual`/`pin`/`score` still survive re-runs.

## Rendering

`src/pages/[lang]/index.astro` renders each feature as a `.sky-social.sky-post`
chip inside the floating `.sky-socials` list, so it reuses the constellation's
existing orbit/animation/gate-wiring with **zero** changes to
[[Constellation.astro]]'s script — the chip just needs `data-facet` (= gate) and
`data-weight`. Post-stars are ~2× a social chip (weight 1.9), image-filled
(circular thumbnail via `imageThumb`), `loading="eager"` (hero, above the fold),
and fall back to a ★ glyph when the chosen post has no image. CSS: `.sky-post*`
in `global.css`. Works without JS (chips sit in the centred fallback row).

The same popularity `scoreOf` and the constellation's visual vocabulary are reused by
two scoped sky maps — [[related-constellation]] (per post) and [[tag-galaxy]] (the
`/[lang]/tags` page) — both via the shared `StarMap.astro` component.

See also [[doors-as-lenses]], [[related-constellation]], [[tag-galaxy]], [[overview]].

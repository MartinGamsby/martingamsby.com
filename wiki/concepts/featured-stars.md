# Featured post-stars (home constellation)

Each home-page door ("gate") hangs one representative blog post off itself as a
**star** in the [[doors-as-lenses]] constellation — so every door visibly anchors
real content, not just a filter. Added 2026-06-16.

## How a gate's star is chosen

`src/lib/featured.ts` → `getGateFeatures(lang, gates)` returns one post per gate,
de-duped across gates (no post features twice; `everything` is listed last so it
takes the top post the specific gates didn't claim). Per gate the candidate pool
is the posts carrying that gate's facet, sorted by:

1. **popularity score** (desc) — from the manual table, see below;
2. **has an image** (desc);
3. **date** (desc).

So with an empty popularity table it degrades to *"most-recent post with an
image"*, which is exactly the baseline Martin asked for. Gates are lenses over
facets (`GATE_FACET`): `book → fiction`, `dev/music/physics` 1:1, `everything →`
the whole pool.

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

- **no flag (the default — "the works")**, all without any API key:
  1. seeds a `{score:0,title}` entry for every post that lacks one;
  2. **auto-discovers YouTube videos** — harvests video IDs from the three
     `CHANNELS` (`@MartinGamsby`, `@MartinGamsbyEN`, the music channel) *and*
     from both Bluesky feeds (which surface older videos the channel `/videos`
     page, capped ~30, omits);
  3. **scrapes each video's public view count** off the watch page
     (`"viewCount":"…"`), and **matches it to a post by title** (normalized exact
     or prefix either direction, ≥15-char guard — so the music-cover catalogue,
     "Take On Me" etc., correctly does NOT match any post);
  4. writes views into `sources.ytView` (+ `links.youtube`), then recomputes
     `score = (manual||0) + Σ(sources × WEIGHTS)` unless a numeric `pin` overrides.
     A post promoted by several videos (full + Short, FR + EN) sums their views.
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
behind login + anti-bot), **Facebook** is a login wall / Graph API, **Typeshare**
is a client-rendered SPA with no data in the HTML and no public API. The blog has
no analytics. So **YouTube view count is the only real auto-signal**; X / Facebook
/ Typeshare / blog are hand-scored by editing `score` (or `pin`). Hand-edited
`manual`/`pin`/`score` survive re-runs.

## Rendering

`src/pages/[lang]/index.astro` renders each feature as a `.sky-social.sky-post`
chip inside the floating `.sky-socials` list, so it reuses the constellation's
existing orbit/animation/gate-wiring with **zero** changes to
[[Constellation.astro]]'s script — the chip just needs `data-facet` (= gate) and
`data-weight`. Post-stars are ~2× a social chip (weight 1.9), image-filled
(circular thumbnail via `imageThumb`), `loading="eager"` (hero, above the fold),
and fall back to a ★ glyph when the chosen post has no image. CSS: `.sky-post*`
in `global.css`. Works without JS (chips sit in the centred fallback row).

See also [[doors-as-lenses]], [[overview]].

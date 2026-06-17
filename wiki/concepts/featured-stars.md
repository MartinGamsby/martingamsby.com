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
cron.** `tools/fetch-popularity.mjs` (also `npm run fetch-popularity`) updates
only entries that carry a `links` map:

- **Bluesky** — public API, no auth (`public.api.bsky.app`): likes + reposts
  from an `at://` uri or a `bsky.app/profile/<h>/post/<rkey>` URL. Verified live.
- **YouTube** — Data API, needs `YOUTUBE_API_KEY` env var: views + likes.
- It writes raw counts into `sources`, then `score = (manual||0) + Σ(sources ×
  WEIGHTS)`, unless a numeric `pin` hard-overrides. Hand-scored entries (no
  `links`) are left untouched. `--dry-run` previews.
- **No clean free API:** Typeshare, Facebook, X/Twitter → score by hand.

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

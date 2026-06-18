# Related-posts constellation (per post)

Every blog post ends with a small constellation of **related posts** — the same
"everything is connected" visual as the home [[featured-stars]] sky, scoped to one
article. Added 2026-06-17. It turns the controlled tag vocabulary (authored in
[[writerhelper]]) into reader-facing navigation.

## How relatedness is computed

`src/lib/related.ts` → `getRelatedPosts(post, lang, limit=8)`. Deterministic, no LLM —
the same "shared tags" signal WriterHelper's tag picker uses, here as navigation. Each
candidate (same language, not this post) is ranked by:

1. **shared tags** (the house tag `Gamsblurb` is ignored — it's on every post);
2. **shared facets**;
3. **manual popularity** `scoreOf` (from `post-popularity.json`, see [[featured-stars]] —
   so the home sky and these mini-maps agree on what's "big");
4. **recency**.

Candidates with zero shared tags AND zero shared facets are dropped.

## Rendering

`src/pages/[lang]/blog/[...slug].astro` maps the related posts to stars and drops in
`<StarMap>` under the post body (only when there's at least one related post). Each
star's colour gate comes from `gateOf(facets, preferSharedFacet)` (`src/lib/blog.ts`) and its
size from relevance (`1 + 0.22·sharedTags`, capped). Image posts render as a circular
thumbnail (the `.sky-post` look), the rest as a ★.

## Shared component: `StarMap.astro`

Both this and the [[tag-galaxy]] use `src/components/StarMap.astro` — a focused,
self-contained constellation (a central "core" node + orbiting `.sky-social`/`.sky-post`
star-chips, connected by facet-coloured canvas lines). It **reuses the home sky's visual
vocabulary** (the `--c-<gate>` palette, `data-facet` colour + `--w` weight) but is fully
decoupled from [[featured-stars]]'s `Constellation.astro` (which is hard-wired to the
home gates/hero). Props: `stars[]` (`href,title,gate,weight,image?,glyph?,label?,tag?`),
`coreLabel`, `coreHref`. Works without JS (chips fall back to a centred wrapped row);
JS lays them out in concentric rings, draws the lines, and floats them — static under
`prefers-reduced-motion`, paused when hidden, palette follows the theme.

## See also
- [[tag-galaxy]] — the page-level sibling · [[featured-stars]] — the home sky +
  popularity table · [[doors-as-lenses]] · [[writerhelper]] — where tags are authored

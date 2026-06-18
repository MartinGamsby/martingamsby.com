# Tag galaxy (`/[lang]/tags`)

A whole-page constellation where every **reused tag is a star** — sized by how often
it's used, coloured by its dominant facet, clickable to filter the posts. Added
2026-06-17. It's the showcase surface for the controlled tag vocabulary that
[[writerhelper]] authors and keeps matched across the FR/EN pair; before this, tags were
written into frontmatter but the site did almost nothing with them.

## Data — derived from posts, no config

`src/lib/tags.ts` → `getTagStars(lang, minCount=2, limit=44)`. Scans `getPosts(lang)`:
counts each tag's frequency and, per tag, which facet it co-occurs with most (its
**dominant facet** → colour gate via `FACET_GATE` in `src/lib/blog.ts`). The house tag
`Gamsblurb` is excluded (on every post) and pure one-offs are dropped (`minCount`), so
the galaxy shows the *reused* vocabulary, biggest-first. Everything is computed at build
time from post data — no separate config file to drift.

## Rendering & interaction

`src/pages/[lang]/tags.astro` sizes each star by frequency (`0.85 + count/maxCount·1.35`)
and shows the count inside the chip with the tag name as a caption. It renders the
shared `<StarMap>` (see [[related-constellation]] for the component) with a `Tags` core,
then a hidden `<PostList tagData>` of every post (each `<li data-tags>`). A small inline
script wires star clicks → reveal the section, set the "showing" label, and unhide only
the posts carrying that tag; a Clear button hides it again. Works without JS to the
extent of showing the star field (the filter list stays hidden); the nav gained a
**Tags** entry, and the i18n strings (`tagsHeading/tagsIntro/tagsShowing/tagsClear`,
`nav.tags`) exist in both languages.

Verified on the built site: 44 stars, correct facet colours + frequency sizing,
connector lines drawn; clicking **Fiction** filtered 131 posts → the 23 Fiction posts.

## See also
- [[related-constellation]] — the per-post sibling + the `StarMap` component ·
  [[featured-stars]] · [[doors-as-lenses]] · [[writerhelper]]

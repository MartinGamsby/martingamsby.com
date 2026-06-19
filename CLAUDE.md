# Agent Instructions — martingamsby.com

This repo is the future home of Martin Gamsby's **unified bilingual personal website**
(Astro, GitHub Pages, custom domain martingamsby.com). It replaces two separate
Jekyll blogs and an old dead WordPress site.

**Start every session by reading:**
1. `PLAN.md` — the plan, locked decisions, phases, open questions.
2. `wiki/index.md` — the project knowledge base (see "LLM wiki" below).

Current status lives at the top of `PLAN.md`. Do not re-derive decisions that are
already locked there; if the user changes one, update `PLAN.md` and log it in the wiki.

## Core design rules (do not violate)

- **Doors are lenses, never silos.** All content lives in ONE pool, tagged by facet
  (`dev`, `physics`, `fiction`, `music`, `ideas`…). Doors/pages only *filter*. Never
  structure content so an item belongs to exactly one section. Always provide a
  "show everything" path.
- **Every page knows its twin.** FR/EN are mirrored routes (`/fr/…`, `/en/…`); the
  language toggle must land on the equivalent page (posts pair via `translationKey`
  frontmatter), falling back gracefully when a twin doesn't exist.
- **Professional work is attributed, not claimed.** Employer demos (e.g. the Lattice
  Hugging Face Space) are shown as "work I did at <employer>", with a local
  screenshot fallback since Martin doesn't control their availability.
- The site must work without JS (Astro zero-JS default); enhancements are progressive.

## LLM wiki (Karpathy pattern)

`wiki/` is an agent-maintained knowledge base so project knowledge compounds across
sessions instead of evaporating. Schema and workflows: `.claude/skills/llm-wiki/SKILL.md`.
Quick rules:
- Read `wiki/index.md` first to locate pages; don't bulk-load the whole wiki.
- When you learn something durable (a decision, a fact about Martin's properties,
  a constraint discovered the hard way), **ingest it**: update/create the page,
  cross-link with `[[wikilinks]]`, update `index.md`, append to `log.md`
  (`## [YYYY-MM-DD] operation | description`).
- Raw materials you shouldn't rewrite go in `raw/` (immutable); wiki pages are yours
  to maintain.

## Related local repos (siblings under `C:\Users\Martin\Documents\GitHub\`)

| Path | What |
|---|---|
| `martingamsby.github.io` | FR Jekyll blog "Gamsblurbs" (~145 posts, YAT theme) — migration source |
| `martingamsby.gitbub.io_en` | EN Jekyll blog (repo name `en`; the `gitbub` typo in the folder name is real) — migration source |
| `CV` | `cvgen.js` CV generator; `cvs/martin-gamsby-en/cv.yaml` is the professional identity source |
| `Interverti` | The book (FR publishes first); gets the `/book` page |
| `Music-Experiment-Game` | Private repo — don't deep-link source from the site |
| `WriterHelper` | Deterministic Python authoring app — writes posts into `src/content/blog/{fr,en}/` |

## Conventions

- Stack: Astro 5 + content collections; every push to `main` deploys via
  `.github/workflows/deploy.yml` to GitHub Pages.
- Commands: `npm run dev` · `npm run build` · `npm run preview` ·
  `npm run new-post -- --fr "Titre" --en "Title" [--facets dev,ideas]` (a
  deterministic helper that scaffolds the paired FR/EN files with a shared
  `translationKey`) · `npm run localize-images` (see below).
- **Post images are self-hosted.** `tools/localize-images.mjs` downloads every
  external `image:` (and re-encodes local ones) into two webp derivatives named
  after the post slug — `public/assets/posts/<slug>.{header,thumb}.webp` (SEO, not
  a hash) — and rewrites the frontmatter to `image:` (large, ≤1200px — the post
  hero) + `imageThumb:` (160px cover — the list thumbnail). It's idempotent (a post
  already at its canonical `<slug>.*` is left alone; one under an old name is
  renamed by copying, no re-download), edits only the frontmatter image lines (body
  stays byte-for-byte), and the no-arg backfill prunes orphaned `.webp`. Inline
  body images are separate — those few are hand-placed PNGs under `/assets/posts/`
  (the prune only touches `.webp`). Two modes: no-arg backfill, or `--file <post.md>` for one post —
  **WriterHelper must call `node tools/localize-images.mjs --file <new post.md>`
  after writing any post that carries an `image:`** so nothing external is hot-linked.
  `imageUrl()` in `src/i18n/ui.ts` resolves the stored path; PostList prefers
  `imageThumb`, the post page uses `image`.
- **Home constellation features one post per gate** (a "star"). `src/lib/featured.ts`
  picks it: highest **trendingScore** (recency-decayed popularity — `(score+1) /
  (log2(ageDays/45+1)+1)`, so engagement fades with age and fresh posts rank high) →
  has-image → most-recent, de-duped across gates (`GATE_FACET` maps `book→fiction`,
  `everything→`all). Popularity lives in
  `src/data/post-popularity.json` (manual, keyed by `translationKey`; `_`-prefixed
  keys ignored) — **the manual JSON is the source of truth, refreshed only on demand,
  never per-commit/cron.** `tools/fetch-popularity.mjs` (`npm run fetch-popularity`):
  the **no-flag run** seeds missing entries, gathers YouTube videos (the 2
  blog-mirroring `CHANNELS` — music channel excluded — + both FR/EN Bluesky feeds
  as a supplemental index), matches each to a post **by title**, writes `sources.ytView`
  (+`links.youtube`) and recomputes `score = manual + Σ(sources×WEIGHTS)` unless a
  numeric `pin`. **Two YouTube modes:** with `YOUTUBE_API_KEY` it uses the Data API
  (paginates EVERY upload + batched views/likes — complete, reliable); without, it
  scrapes best-effort (~30 recent from the channel page + Bluesky-shared) and
  YouTube **rate-limits (429)** on repeated runs — so a key is recommended. Flags:
  `--seed` (scaffold only), `--list` (standings only), `--dry-run`, `--offline`.
  YouTube view count is the only real auto-signal in the script —
  Bluesky engagement is ~0 (used only for discovery) and the blog has no analytics.
  **Login-walled platforms (X/Twitter first, then Typeshare/Medium/LinkedIn/FB/IG) are
  read from the operator's browser** by the `.claude/skills/popularity` skill (analytics,
  not authoring) and folded in via `node tools/fetch-popularity.mjs --import <readings>`
  (or `--worklist` to enumerate the footer social links — **incremental by default**,
  emitting only links not yet read for a platform + a per-platform last-swept summary from
  the `_fetched` stamp; `--all` forces a full re-pass, e.g. a first "Typeshare pass").
  `WEIGHTS` includes
  `xView:1`/`xLike:100`/`xRepost:75` and `liImpression:1`/`liReaction:100`/`liComment:100`/
  `liRepost:75` (LinkedIn — `impressions` is the author-only reach signal, read
  deterministically via `javascript_tool` like X; see the skill); hand-edited
  `manual`/`pin`/`score` survive re-runs.
  Stars render as `.sky-social.sky-post` chips so the constellation script is untouched.
  See `wiki/concepts/featured-stars.md`. (A popularity *skill* is fine — it's read-only
  telemetry; the "no skills" rule above is about **authoring**.)
- **Authoring is deterministic — never via a Claude skill.** Posts are
  written/translated in **WriterHelper** (sibling repo, a Python model→template→file
  pipeline) which writes the `.md` pair directly into `src/content/blog/{fr,en}/`;
  `tools/new-post.mjs` is a low-level scaffolding helper WriterHelper (or a human)
  can call. A `new-post` *skill* was added in error and removed — don't reintroduce
  skills for authoring. See `WriterHelper/PLAN_ASTRO_FORMAT.md` for the format
  contract and `wiki/sources/writerhelper.md`.
  - **Future direction (deferred):** fold WriterHelper into this site as a web
    app (it has a started `web/` + `webapi.py`). Not this session.
- **Domain (cutover done 2026-06-13)**: the site is live at the apex
  `martingamsby.com`. `astro.config.mjs` is `site: 'https://martingamsby.com'`,
  `base: '/'`; the custom domain is pinned by `public/CNAME` so the Pages deploy
  doesn't drop it. ALL internal links must still go through `url()` from
  `src/i18n/ui.ts` (base is `/` now, but the helper stays the source of truth).
  Post `image:` values go through `imageUrl()` (external URLs pass through; bare
  paths are local `public/` assets routed through the base). Loose end: the
  redirect stubs in the two old Jekyll repos still point at the old
  `…/martingamsby.com/{lang}/blog/<stem>/` project URL — re-run
  `tools/make-redirect-stubs.mjs --target-base https://martingamsby.com` in those
  repos. HTTPS may lag while GitHub provisions the cert; enable "Enforce HTTPS" in
  repo Settings → Pages once it's available.
- Blog posts: markdown in `src/content/blog/{fr,en}/` (folder = language, filename
  keeps the `YYYY-MM-DD-slug` form and is the URL slug); frontmatter carries
  `title`, `date`, `translationKey` (shared by twins — the language toggle depends
  on it), `facets[]` (`dev|physics|fiction|music|ideas`), `tags[]`, optional `draft`,
  optional `aliases[]` (see next).
- **Retired-site redirects via `aliases[]`.** A post can list extra bare-slug URLs
  it answers to in `aliases: [slug, …]` (no leading slash). The `guidepour-redirects`
  Astro integration (`src/lib/guidepour-redirects.mjs`, wired in `astro.config.mjs`)
  emits a `dist/<alias>/index.html` meta-refresh stub → that post's canonical
  `/{lang}/blog/<stem>/` on every `astro build` (NOT a postbuild npm script — CI's
  `withastro/action` runs `astro build` directly). It **fails the build** on a
  SAME-language duplicate alias, or one that shadows a real route. This retires
  **guidepour.com** (FR "Guide pour ✳") and **guidance4.com** (EN "Guidance for ✳"),
  both by the fictional Djosh Sho; Martin path-forwards `<domain>/* → martingamsby.com/*`
  at the registrar, so both emit (`EMIT_LANGS = ['fr', 'en']`) — **every alias is unique
  across both languages** and the build **throws on any duplicate**. The FR book and the
  EN book once shared 9 slugs (proper nouns/cognates: web5, conferences, deja-vu,
  adrenaline, tesla, mozart, einstein, resilience, newton); since the EN book is a draft
  (unprinted, mutable), those 9 were **renamed on the EN side** in both the EN posts'
  `aliases:` AND `Interverti/content/interverti/en/book.draft.md` (e.g. `tesla →
  nikola-tesla`, `web5 → web-5-0`, `conferences → conference`, `deja-vu → dejavu`). The
  two books have the same 33 entries; all now have posts (17 were generated from the
  book text). Last build: **66 stubs** (33 FR + 33 EN). EN slugs come from the source of truth
  `Interverti/content/interverti/en/book.draft.md`, which prints `guidance4.com/<slug>`
  and uses "**Guidance for**" (not "Guide for"). The old slugs are FRENCH/ENGLISH book
  slugs that rarely match the filename (`/metropole`→`grand-metropolien`,
  `/math`→`mathematician`), so they're stored explicitly — and they're **immutable**
  (printed in the book), so never rename an existing alias.
  **WriterHelper must set `aliases:` on any new Guide Pour entry** (and tag it
  `Djosh Sho`, which `isGuidePour()`/`getGuidePourPosts()` in `src/lib/blog.ts` use to
  populate the `/{lang}/guidepour` page). See `wiki/concepts/guidepour-redirects.md`.
- French content is written in Quebec French; keep Martin's colloquial voice when
  touching post text. Never machine-rewrite migrated posts — migration preserves
  content byte-for-byte apart from frontmatter.
- Update this file and `PLAN.md` as decisions land; they are the contract between
  sessions.

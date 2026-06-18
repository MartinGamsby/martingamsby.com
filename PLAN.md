# martingamsby.com — Site Plan

Status: **Phase 2 (migration) in progress** — scaffold live, back-catalogue
imported, **domain cutover done** (live at `martingamsby.com`), post images
(thumbnails + hero) now render. Last updated: 2026-06-13.

## Vision

One bilingual site, one identity: *"I do many things, and everything is connected"*
(the blog's own tagline, «Tout est connecté» — INTP / hyper-fixations framing).

The site is **not** organized into categories. There is **one content pool** — every
blog post, project, video, and paper carries facet tags — and the homepage offers
**doors**: pre-applied filters with a tailored intro for a given kind of visitor.
A door is a lens, never a silo. Every filtered view has a "show everything" escape
hatch. A post can carry several facets at once (e.g. `physics` + `ideas`).

## Locked decisions

| Decision | Choice |
|---|---|
| Stack | **Astro** (first-class i18n routing, markdown content collections, zero-JS default) |
| Hosting | GitHub Pages via GitHub Actions, in this repo (`MartinGamsby/martingamsby.com`) |
| Domain | **Cutover done 2026-06-13** — live at apex `martingamsby.com` (`site`/`base` flipped in `astro.config.mjs`, `public/CNAME` added). HTTPS cert may still be provisioning. Old WordPress there was dead (HTTP 500). |
| Blogs | **Migrate both Jekyll blogs in** (FR `martingamsby.github.io` + EN `en` repo, ~145 posts each); old URLs get meta-refresh redirect stubs |
| Filter UX | **Audience doors** on the homepage (no forced gate, SEO/deep links intact) |
| Doors (working set) | Software · Physics · Book · Music · **Everything** — names/wording still open, more doors possible; they're cheap (just filters) |
| Languages | `/fr/…` and `/en/…` mirrored routes; root `/` redirects by browser language with remembered preference |

## Site map (mirrored per language)

| Page | Contents |
|---|---|
| `/{lang}/` | Hero (name + one-liner), the doors, latest-posts strip, book banner during launch window |
| `…/dev` | CV pitch (13+ yrs C++/Python/Qt, AI/ML, 50M+ users, 3 patents), curated personal projects, **professional work subsection** (see below), CV PDF, GitHub link |
| `…/physics` | The preprint *Replacing Dark Energy and Unifying Large-Scale Anomalies* (Zenodo, DOI 10.5281/zenodo.20482196 — paper + simulation code in one record), ORCID 0009-0007-4069-9687, ProgenitorNodeModelCosmology, physics-tagged posts |
| `…/book` | Interverti: cover, blurb, excerpt, buy links when live. FR first; EN page = "coming soon" |
| `…/guidepour` | Djosh Sho author page (the in-universe "Guide pour ✳" column from the book); bio + fiction note + the Guide Pour entry list. Old guidepour.com / guidance4.com links redirect in (see open question #4) |
| `…/music` | Music Experiment Game story, YouTube embeds (FR channel on /fr, EN channel on /en) |
| `…/blog` | Full stream + facet chips + Pagefind search (handles bilingual) |
| `…/about` | The existing INTP "too many interests" essay, contact |
| `…/links` | Linktree-style page; both linktr.ee URLs eventually point here |

## Dev door: personal vs professional work

Show both, clearly separated:
- **Personal projects** (curated, with repo links): WriterHelper, ProgenitorNodeModelCosmology,
  Dodo, AnimalEnPeril, SymptomsTracker, NoiseGeneration, Music Experiment Game
  (repo is **private** — link YouTube/demo output, not source, unless it goes public).
- **Professional work** — attributed to the employer, presented as "work I did at …",
  never as personal projects:
  - *Glance by Mirametrix*® — shipped pre-installed on 50M+ OEM laptops (Lenovo, ASUS).
  - 3 patent contributions.
  - [Lattice sensAI Edge Vision Engine SDK Space](https://huggingface.co/spaces/LatticeSemi/sensAI-Edge-Vision-Engine-SDK)
    (Hugging Face demo, human sensing + object detection). Public and linkable, but
    employer-controlled: keep a screenshot + one-line description locally so the
    portfolio entry survives if the Space is renamed/taken down. Same rule for any
    future work demo: link it, screenshot it, attribute it.

## Bilingual mechanics (the thing the current setup can't do)

- Every page knows its twin: persistent FR/EN toggle goes to the *same article* in
  the other language, not the other homepage.
- Posts get a `translationKey` in frontmatter at migration time. FR/EN posts pair
  almost 1:1 by date; a script proposes the mapping, stragglers fixed by hand
  (a few posts exist in only one language — the toggle then falls back to that
  language's blog index with a note).
- `hreflang` alternates on every page; per-language RSS feeds and sitemaps.

## Migration

1. Script converts ~290 posts from both Jekyll repos: frontmatter mapping
   (title/date/tags), translation pairing, first-pass facet tags inferred from
   existing Jekyll tags/categories, then manual review of the facet assignments.
   **Pairing shortcut discovered 2026-06-12**: Jekyll posts already carry a `ref:`
   frontmatter field pointing at the twin's URL — use it as the primary pairing
   signal (date-matching only as fallback). Also: post bodies repeat the title as
   a `### **…**` heading; the migration should drop that first heading (the layout
   renders the title) — verify the pattern holds across all posts.
2. Old post URLs (`martingamsby.github.io/...` and `.../en/...`) each get a tiny
   meta-refresh stub pointing at the new URL (GitHub Pages has no server redirects).
3. The two old repos stay up as redirect shells; new posting happens only here.

## Phases

- [x] **Phase 1 — Scaffold** (done 2026-06-12): Astro 5 project, manual `[lang]`
      i18n routing, base layout/design system (light/dark, warm paper + indigo),
      GitHub Actions → Pages deploy, root language redirect, door stubs that
      already filter by facet, about + links pages, one real FR/EN post pair
      proving `translationKey`, and the `new-post` skill/script.
      Was live at martingamsby.github.io/martingamsby.com/; **domain cutover done
      2026-06-13** — `site`/`base` flipped in `astro.config.mjs` + `public/CNAME`.
- [~] **Phase 2 — Migrate** (script done 2026-06-13): `tools/migrate-jekyll.mjs`
      converts both Jekyll repos → `src/content/blog/{fr,en}` in the WriterHelper
      Astro format. Outcome: **265 posts** (131 twin pairs + 2 FR-only + 1 EN-only),
      build validates all of them (283 pages). Re-runnable (clears + rewrites the
      blog dirs from the read-only Jekyll sources); writes `tools/migration-report.md`.
      Pairing: `ref:`+date primary, unique-date then loose-`ref` fallback —
      **discovered 5 FR posts carry copy-paste-wrong `ref:` URLs** (pointed at a
      neighbour); date-first resolution fixes them. **Redirect stubs shipped**
      (`tools/make-redirect-stubs.mjs`): the published (git-tracked) posts in both
      old repos are now plugin-free `layout: redirect` meta-refresh shells →
      `…/martingamsby.com/{lang}/blog/<stem>/` (FR 125 + EN 124); untracked drafts
      left alone; re-run with `--target-base` at cutover. FR-only
      `ce-qui-peut-tout-gacher`, `crypto`; EN-only `hello-world` → toggle falls
      back gracefully. Remaining Phase-2 polish: **facet review** — assignments
      are a keyword first-pass (see the report's "Non-`ideas`" list). NB: the
      migration also pulled in a handful of *unpublished* drafts from the old
      working trees onto the new site (e.g. `…-11-ans`/`…-11-years`); mark
      `draft: true` if any shouldn't be live.
- [ ] **Phase 3 — Doors**: home, dev, physics, book, music, about, links pages ×2 languages.
- [ ] **Phase 4 — Polish & launch**: RSS, sitemap, hreflang, OG images, Pagefind
      search, ~~DNS cutover~~ (**done 2026-06-13**), linktrees → `/links`, `llms.txt`.
      Time launch so the book page is live when Interverti publishes (FR edition
      ships first). Post-cutover loose end: re-run `tools/make-redirect-stubs.mjs`
      with `--target-base https://martingamsby.com` in the two old Jekyll repos so
      their meta-refresh stubs hit the apex domain, not the old project URL. OG
      images can reuse the per-post `image:` frontmatter (now rendered as
      list-thumbnail + post hero via `imageUrl()`).

## Open questions

1. ~~Linktree contents~~ **Resolved 2026-06-11**: extracted from saved pages — full
   per-language socials table in `wiki/sources/profiles-and-channels.md` (X, Bluesky,
   YouTube, blogs all have FR+EN twins; Facebook is FR-only, Typeshare EN-only).
2. ~~Physics preprint~~ **Resolved 2026-06-11**: Zenodo record
   https://zenodo.org/records/20482196 (DOI 10.5281/zenodo.20482196, paper + code,
   v1.0.2) — details in `wiki/sources/physics-preprint.md`.
3. **Domain registrar** — where does martingamsby.com DNS live (needed for cutover)?
4. ~~**guidepour.com**~~ **Resolved 2026-06-17**: it's Martin's (a retired Grav
   site; the "Guide pour ✳" entries by the fictional Djosh Sho, from Interverti).
   Canonical book page is `martingamsby.com/book`. The Grav site is being killed and
   **forwarded into martingamsby.com**: Martin sets path-preserving forwarding at the
   registrar (`guidepour.com/* → martingamsby.com/*`; fallback = a GitHub Pages repo
   if it can't), and the site emits a bare-slug redirect stub per entry from a new
   `aliases:` frontmatter field (`/agnostique → /fr/blog/2016-02-01-agnostique/`) via
   the `guidepour-redirects` build integration. New `/{lang}/guidepour` page carries
   the Djosh Sho bio. **All 33 entries now have posts** — the 16 originals plus **17
   generated from both books** (`Interverti/content/interverti/{fr/book.md,en/book.draft.md}`,
   the source of truth), bodies synced to the current book text, dated in book order.
   English sibling **guidance4.com** (EN, "Guidance for ✳") forwards the same way, so
   the integration emits **both** (`EMIT_LANGS=['fr','en']`) — **66 stubs**, build throws
   on any duplicate. The FR + EN books shared **9 slugs**; since the EN book is unprinted
   (mutable), those 9 were **renamed on the EN side** (e.g. tesla→nikola-tesla,
   web5→web-5-0) in the EN posts' aliases AND `en/book.draft.md`, so every slug is unique
   and both languages land correct. See `wiki/concepts/guidepour-redirects.md`. Minor
   leftovers: the hidden `/crypto` article (not a book entry) and Coal Ton's bio.
5. **Door wording** — current set is a proposal; Martin said "maybe other doors,
   not sure yet".
6. ~~**Public contact method**~~ **Resolved 2026-06-13**: option (c) — publish
   `martingamsby@gmail.com` (a dedicated address, *not* the official CV one),
   obfuscated. The literal address is **never written verbatim in this public
   repo**: pages show `martingamsby [à] gmail [point] com` and a tiny inline
   script reassembles a real `mailto:` in the browser from `data-` parts, so the
   served static HTML stays clean for scrapers. First used on `/book`
   (`src/pages/[lang]/book.astro`); reuse the same `.email-link` pattern elsewhere.

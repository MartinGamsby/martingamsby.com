# martingamsby.com — Site Plan

Status: **Phase 2 (migration) in progress** — scaffold live, back-catalogue
imported. Last updated: 2026-06-13.

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
| Domain | `martingamsby.com` DNS cutover after launch (old WordPress there is dead — HTTP 500) |
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
      Live at martingamsby.github.io/martingamsby.com/ — at domain cutover, flip
      `site`/`base` in `astro.config.mjs` and add the CNAME.
- [~] **Phase 2 — Migrate** (script done 2026-06-13): `tools/migrate-jekyll.mjs`
      converts both Jekyll repos → `src/content/blog/{fr,en}` in the WriterHelper
      Astro format. Outcome: **265 posts** (131 twin pairs + 2 FR-only + 1 EN-only),
      build validates all of them (283 pages). Re-runnable (clears + rewrites the
      blog dirs from the read-only Jekyll sources); writes `tools/migration-report.md`.
      Pairing: `ref:`+date primary, unique-date then loose-`ref` fallback —
      **discovered 5 FR posts carry copy-paste-wrong `ref:` URLs** (pointed at a
      neighbour); date-first resolution fixes them. Remaining Phase-2 work:
      (a) **facet review** — assignments are a keyword first-pass (see the report's
      "Non-`ideas`" list); (b) **redirect stubs** in the two old repos (touches
      sibling repos — not done, needs go-ahead). FR-only `ce-qui-peut-tout-gacher`,
      `crypto`; EN-only `hello-world` → toggle falls back gracefully.
- [ ] **Phase 3 — Doors**: home, dev, physics, book, music, about, links pages ×2 languages.
- [ ] **Phase 4 — Polish & launch**: RSS, sitemap, hreflang, OG images, Pagefind
      search, DNS cutover, linktrees → `/links`, `llms.txt`. Time launch so the book
      page is live when Interverti publishes (FR edition ships first).

## Open questions

1. ~~Linktree contents~~ **Resolved 2026-06-11**: extracted from saved pages — full
   per-language socials table in `wiki/sources/profiles-and-channels.md` (X, Bluesky,
   YouTube, blogs all have FR+EN twins; Facebook is FR-only, Typeshare EN-only).
2. ~~Physics preprint~~ **Resolved 2026-06-11**: Zenodo record
   https://zenodo.org/records/20482196 (DOI 10.5281/zenodo.20482196, paper + code,
   v1.0.2) — details in `wiki/sources/physics-preprint.md`.
3. **Domain registrar** — where does martingamsby.com DNS live (needed for cutover)?
4. **guidepour.com** — is it Martin's (it's referenced inside the book)? Canonical
   book page: `martingamsby.com/book` or guidepour.com?
5. **Door wording** — current set is a proposal; Martin said "maybe other doors,
   not sure yet".
6. **Public contact method** — Martin has an official email (the one on his CV)
   but is hesitant to publish it. Options: (a) static-friendly contact form
   (e.g. Formspree free tier), (b) socials-only contact (LinkedIn/Bluesky), (c)
   obfuscated mailto (deters only lazy scrapers). Until decided: **no raw email on
   the site — or anywhere in this public repo.**

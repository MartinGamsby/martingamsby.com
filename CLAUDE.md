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
  `translationKey`).
- **Authoring is deterministic — never via a Claude skill.** Posts are
  written/translated in **WriterHelper** (sibling repo, a Python model→template→file
  pipeline) which writes the `.md` pair directly into `src/content/blog/{fr,en}/`;
  `tools/new-post.mjs` is a low-level scaffolding helper WriterHelper (or a human)
  can call. A `new-post` *skill* was added in error and removed — don't reintroduce
  skills for authoring. See `WriterHelper/PLAN_ASTRO_FORMAT.md` for the format
  contract and `wiki/sources/writerhelper.md`.
  - **Future direction (deferred):** fold WriterHelper into this site as a web
    app (it has a started `web/` + `webapi.py`). Not this session.
- **Base path**: until the domain cutover the site lives at
  `martingamsby.github.io/martingamsby.com/` — `base` is set in `astro.config.mjs`
  and ALL internal links must go through `url()` from `src/i18n/ui.ts`. At cutover,
  change `site`/`base` in `astro.config.mjs` (one place) and add the CNAME.
- Blog posts: markdown in `src/content/blog/{fr,en}/` (folder = language, filename
  keeps the `YYYY-MM-DD-slug` form and is the URL slug); frontmatter carries
  `title`, `date`, `translationKey` (shared by twins — the language toggle depends
  on it), `facets[]` (`dev|physics|fiction|music|ideas`), `tags[]`, optional `draft`.
- French content is written in Quebec French; keep Martin's colloquial voice when
  touching post text. Never machine-rewrite migrated posts — migration preserves
  content byte-for-byte apart from frontmatter.
- Update this file and `PLAN.md` as decisions land; they are the contract between
  sessions.

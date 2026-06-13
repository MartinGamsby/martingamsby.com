# Operation Log

Append-only. Format: `## [YYYY-MM-DD] operation | description`

## [2026-06-11] ingest | Initial research: inventoried both Jekyll blogs (~145 paired posts each, YAT theme, active), found martingamsby.com WordPress dead (HTTP 500), listed public GitHub repos, read CV identity, confirmed Music-Experiment-Game repo is private, linktrees block scrapers.

## [2026-06-11] ingest | Plan decided with Martin: one unified Astro site in this repo, doors-as-lenses UX (Software/Physics/Book/Music/Everything), blogs migrate in, /fr + /en mirrored routes. Written to PLAN.md.

## [2026-06-11] ingest | Martin confirmed: employer work demos (Lattice HF Space) go on the dev door with attribution; repo gets LLM wiki + skills + CLAUDE.md. Wiki seeded.

## [2026-06-11] ingest | Resolved open questions 1+2: linktree links extracted from Martin's saved pages (revealed per-language X, Bluesky, Facebook FR, Typeshare EN accounts); physics preprint is Zenodo 10.5281/zenodo.20482196 (paper+code record, v1.0.2, 2026-05-31). New page [[physics-preprint]]; rewrote [[profiles-and-channels]]. Email: martin.gamsby@ is official but NOT to be published without explicit OK (new open question #6).

## [2026-06-12] ingest | Phase 1 scaffold built and verified (Astro 5.18, 20 pages, twin links + base path + root redirect checked in dist). Discovery: Jekyll posts carry a `ref:` frontmatter field naming their twin URL — primary pairing signal for Phase 2 migration; bodies duplicate the title as a `### **…**` heading (drop at migration). Updated [[jekyll-blogs]] and PLAN.md.

## [2026-06-12] lint | Repo made PUBLIC (free-plan GitHub Pages requires it; Martin chose scrub-and-publish). Emails and personal details scrubbed from wiki + PLAN.md; history squashed to a single clean root commit so the scrubbed strings never existed in public history. Standing rule: no email addresses or private personal details anywhere in this repo.

## [2026-06-12] ingest | SITE IS LIVE at https://martingamsby.github.io/martingamsby.com/ — deploy workflow green, FR homepage verified (doors, posts, footer socials). Gotcha: enabling Pages via API on a private free-plan repo fails 422; flipping the repo public auto-enabled Pages in `legacy` mode, switched to `workflow` via PUT. Workflow opts into Node 24 ahead of the 2026-06-16 forced default.

## [2026-06-12] correction | Martin authors via WriterHelper (sibling Python/Qt app), not a Claude skill. The `new-post` **skill** I added was wrong → DELETED. The `new-post.mjs` **script** is fine and KEPT (a deterministic helper WriterHelper can call). Wrote the format-migration plan at `WriterHelper/PLAN_ASTRO_FORMAT.md`; added [[writerhelper]]. Future direction (deferred): fold WriterHelper into this site as a web app (it has a started `web/`+`webapi.py`). Also: I put `.claude/launch.json` in the Interverti repo by mistake (session cwd) — Martin moved it to this repo's `.claude/`.

## [2026-06-12] ingest | Design overhaul (Martin: scaffold looked "dull", wants flashy): constellation canvas hero (facet-hued nodes+links, reduced-motion static frame, theme-aware palette), Fraunces/Inter variable fonts, gradient wordmark + hero name, per-facet door hues w/ icons + glow hovers (asterisk icon for "Tout" = the book's wildcard motif), aurora background wash, glass sticky header, gradient chips. Fixed UTC date-shift bug in formatDate (frontmatter dates are UTC midnight — format with timeZone:'UTC'). Verified: dark desktop screenshot, light/mobile via computed styles (preview_screenshot tool wedges on this site: it resets the tab to the server root, which 404s under the /martingamsby.com base).

# The two Jekyll blogs ("Gamsblurbs")

Both use the jekyll-theme-yat fork, title "Gamsblurbs", author Martin Gamsby.
They are the migration source for the new site's blog (Phase 2).

| | FR | EN |
|---|---|---|
| Local path | `C:\Users\Martin\Documents\GitHub\martingamsby.github.io` | `C:\Users\Martin\Documents\GitHub\martingamsby.gitbub.io_en` (folder-name typo is real) |
| GitHub repo | `MartinGamsby/martingamsby.github.io` (fork of jeffreytse/jekyll-theme-yat) | `MartinGamsby/en` |
| Served at | martingamsby.github.io | martingamsby.github.io/en |
| Posts (2026-06-11) | ~145 | ~140 |

**Migration ran 2026-06-13** via `tools/migrate-jekyll.mjs` (site repo). Outcome:
**265 posts** out = 131 twin pairs + 2 FR-only (`ce-qui-peut-tout-gacher`,
`crypto`) + 1 EN-only (`hello-world`); the site build validates all of them. The
script is re-runnable: it clears and rewrites `src/content/blog/{fr,en}` from the
read-only Jekyll sources and emits `tools/migration-report.md` (counts, pairing
method, FR/EN-only lists, and every non-`ideas` facet to spot-check). Format per
`WriterHelper/PLAN_ASTRO_FORMAT.md`: drop the `### **title**` heading,
`excerpt_image`→`image:`, drop `categories`, keep `tags`, shared `translationKey`
= `<date>-<EN slug>`. Body preserved otherwise (raw HTML `<ul>/<span>` etc. passes
through Markdown fine).

Facts that matter for migration:
- **Posts declare their twin via a `ref:` URL**, BUT it is not fully trustworthy:
  **5 FR posts carry copy-paste-wrong `ref:`** pointing at a neighbouring post
  (`ce-qui-peut-tout-gacher` + `les-blessures-de-votre-cerveau` both → EN
  `your-brain-injuries`; `moins-de-classement` + `le-classement-sans-dessus-dessous`
  + `le-gros-avantage-de-lecole` all → EN `the-big-advantage-of-school`). So the
  script pairs in passes: `ref:`+same-date first (trustworthy), then unique-date,
  then loose-`ref` (legit cross-language date drift), deduping each EN twin. This
  resolves the bad refs to their real same-date twins. Bodies repeat the title as
  a leading `### **…**` heading — dropped at migration (verified the pattern holds).
- Posts pair across languages by **date** (slugs differ: `2016-03-01-poisson-rouge`
  ↔ `2016-03-01-goldfish`). A few exist in only one language (e.g. FR
  `2024-12-03-lutin-jour-2/3` vs EN `elf-day-2/3` DO pair; EN
  `2025-06-21-hello-world` has no FR twin; both sides have an empty-slug file:
  FR `2026-06-11-.md`, EN `2025-06-28-.md` — inspect before migrating).
- Content spans 2009→today: 2009–2017 posts are old WordPress-era imports; the
  blog is **active** (post dated 2026-06-11), so migration must not freeze posting
  for long — plan the cutover.
- FR `_posts/bak` directory exists — exclude backups from migration.
- Description/tagline (FR): «Tout est connecté: Développement personnel/logiciel,
  Personnalités, Chiffres, Anthropologie, Méta-formule, Curiosités, Algorithmes,
  Agriculture, Urbanisme…» — the seed of the [[doors-as-lenses]] identity.
- `about.html` (FR) holds the INTP "too many interests" essay → becomes `/about`.
- Old URLs (`/{yyyy}/{mm}/{dd}/{slug}.html` style) need meta-refresh redirect stubs
  left behind in the old repos.

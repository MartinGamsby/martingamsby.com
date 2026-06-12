# The two Jekyll blogs ("Gamsblurbs")

Both use the jekyll-theme-yat fork, title "Gamsblurbs", author Martin Gamsby.
They are the migration source for the new site's blog (Phase 2).

| | FR | EN |
|---|---|---|
| Local path | `C:\Users\Martin\Documents\GitHub\martingamsby.github.io` | `C:\Users\Martin\Documents\GitHub\martingamsby.gitbub.io_en` (folder-name typo is real) |
| GitHub repo | `MartinGamsby/martingamsby.github.io` (fork of jeffreytse/jekyll-theme-yat) | `MartinGamsby/en` |
| Served at | martingamsby.github.io | martingamsby.github.io/en |
| Posts (2026-06-11) | ~145 | ~140 |

Facts that matter for migration:
- **Posts already declare their twin**: the Jekyll frontmatter has a `ref:` field
  with the twin's URL (verified on the 2026-01-23 pair, both directions). Use it
  as the primary pairing signal; date-matching is the fallback. Post bodies also
  repeat the title as a leading `### **…**` heading — drop it at migration (the
  new layout renders the title), but verify the pattern across all posts first.
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

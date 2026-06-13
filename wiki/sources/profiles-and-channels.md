# Profiles & channels

The identities the site must link (and eventually consolidate via `/links`).
Linktree contents extracted 2026-06-11 from saved pages (open question #1 resolved).
The FR/EN split runs through almost every platform — `/links` should respect it.

## Per-language socials (from the linktrees)

| Platform | FR | EN |
|---|---|---|
| X / Twitter | x.com/MartinGamsby | x.com/Martin_Gamsby |
| Bluesky | bsky.app/profile/martin-gamsby.bsky.social | bsky.app/profile/martingamsby.bsky.social |
| YouTube | youtube.com/@MartinGamsby | youtube.com/@MartinGamsbyEN |
| Blog (current) | martingamsby.github.io | martingamsby.github.io/en |
| Facebook | facebook.com/martin.gamsby | — |
| Typeshare | — | typeshare.co/martingamsby |

## Language-neutral

- **LinkedIn**: linkedin.com/in/martingamsby
- **ORCID**: 0009-0007-4069-9687 (new, 2026) — physics door, see [[physics-preprint]].
- **GitHub**: github.com/MartinGamsby — see [[github-repos-and-demos]].
- **CV**: sibling repo `CV` (`cvgen.js`); `cvs/martin-gamsby-en/cv.yaml` is the
  canonical professional summary. Dev door offers the generated PDF.

## Linktrees (to be replaced by `/links`)

- FR: linktr.ee/mgamsby · EN: linktr.ee/gamsby (they cross-link each other).
- Both block scrapers (HTTP 403); contents above came from Martin's saved copies
  in `C:\Users\Martin\Downloads\linktree\` (profile pictures there too — reusable
  for the site's avatar/OG images).

## Contact / email

- **Resolved 2026-06-13** (PLAN.md open question #6): the public contact address is
  **`martingamsby@gmail.com`** — a dedicated Gmail Martin chose to publish, *not*
  the official CV address. The **official CV address still never goes in this repo
  or on the site**, and neither does the literal Gmail string.
- **Obfuscation contract (follow this everywhere email appears):** pages render the
  address as `martingamsby [à] gmail [point] com` and carry the parts as
  `data-user` / `data-domain` / `data-tld` on an `<a class="email-link">`; a tiny
  inline script reassembles `mailto:martingamsby@gmail.com` in the browser only.
  Net effect: the served static HTML never contains the verbatim address (verified —
  `rawHasEmail: false`), so scrapers reading source/HTML get only the obfuscated
  form, while humans get a working click-to-mail. First implemented on `/book`
  (`src/pages/[lang]/book.astro`).
- The old blog's `_config.yml` address is secondary/legacy — don't surface it.

## Dead / unresolved

- **martingamsby.com (old)**: WordPress, `/` → `/martin-gamsby/` returns HTTP 500
  (verified 2026-06-11) — dead; 2009–2017 posts already migrated into
  [[jekyll-blogs]]. Registrar unknown (open question #3).
- **guidepour.com**: referenced inside the book *Interverti*; ownership/role vs
  `/book` page unresolved (open question #4).

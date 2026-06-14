# Link icons

Decided 2026-06-14. Every external/social/website link on the site shows a brand
icon, all from **one pack** so the style is uniform (Martin's ask: "add an icon …
the same style for every one of them").

## The pack

**Font Awesome Free** — `@fortawesome/free-brands-svg-icons` +
`@fortawesome/free-solid-svg-icons` (CC BY 4.0, royalty-free; attribution lives in
the header comment of `src/lib/icons.ts` and `src/styles/global.css`). Chosen over
**Simple Icons** (CC0) because Simple Icons no longer ships **LinkedIn** or
**Amazon** (legally removed) — and LinkedIn is in the footer on every page while
Amazon is the `/book` CTA, so those two are the most prominent links and must be
on-style. Font Awesome covers all the brands here except Zenodo/Typeshare/DOI,
which fall back to a neutral `faGlobe` so a row of links still reads as a set.

The packages are **build-time only** — icons are inlined as zero-JS SVG; nothing
from FA ships to the client (verified: `svg class="icon"` present in built HTML).

## How it's wired

- `src/lib/icons.ts` — the registry: maps an `IconName` (`youtube|bluesky|x|
  facebook|typeshare|github|linkedin|orcid|amazon|zenodo|doi|web`) to an FA glyph;
  `getIcon(name)` returns `{ viewBox, d }`. (Type lives here, NOT in the `.astro`
  component — Astro's frontmatter parser choked on an exported union type.)
- `src/components/Icon.astro` — thin renderer: `<Icon name=… size=… />` → inline
  `<svg class="icon" fill="currentColor">`. Inherits text color; `.icon` base rule
  in `global.css`.
- Data carries the icon key: `Social.icon` in [[profiles-and-channels]]'s data
  mirror `src/data/socials.ts`; DoorStub link objects take `{ label, url, icon }`.

## Where icons now appear

Footer (Base.astro, every page) · `/links` · DoorStubs on `/dev` (GitHub),
`/physics` (Zenodo→globe, ORCID, GitHub), `/music` (YouTube) · `/book` Amazon
buy button.

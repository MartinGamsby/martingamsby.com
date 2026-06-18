# Guidepour redirects + the Djosh Sho page

`guidepour.com` is Martin's retired Grav CMS site (latest local copy
`C:\wamp64-3.2.3\www\guidepour.com2`). It hosted the in-universe **"Guide pour ✳"**
column — short entries by **Djosh Sho**, a character (the narrator) of Martin's novel
*Interverti*. The printed book deep-links `guidepour.com/<slug>`. Decision (Martin,
2026-06-17): kill the Grav site and **forward every link into martingamsby.com**, where
the entries already live. Added 2026-06-17.

## The entries already exist on the site

The 16 live entries were converted to Gamsblurb posts years ago (`convert.py` in the
Grav `01.home/`) and pulled in during the Jekyll migration, so they're already
`facets: [fiction]` posts **in both FR and EN**, tagged `Guide Pour`/`Guide For`,
`Interverti (Roman)`/`Interverted (Novel)`, **`Djosh Sho`**, `Gamsblurb`. This was a
redirect + author-page + tag-tidy job, **not** a content migration. **Not every entry is
fiction** — some "Guide pour" pieces are real-life facts; for those the `fiction` facet
(and the `Fiction` tag, which now follows it via WriterHelper's tag migration) is
dropped. The `Djosh Sho` tag is the only thing that defines the column.

## Two-layer redirect (the "no manual page per entry" requirement)

`guidepour.com/agnostique` → (registrar) → `martingamsby.com/agnostique` → (stub) →
`/fr/blog/2016-02-01-agnostique/` (the canonical post).

1. **Registrar (Martin's step):** path-preserving forwarding
   `guidepour.com/* → https://martingamsby.com/*` (apex default → `/fr/guidepour`).
   Fallback if the registrar can't path-forward: a tiny GitHub Pages repo named
   `guidepour.com` with a `CNAME` + the same stubs (ToS-OK). **Bare slug, not a
   `/guidepour/` subfolder** — simple forwarding can't add a path prefix.
2. **Site (`aliases` frontmatter + a build integration):** each entry lists its old
   slug in `aliases: [agnostique]`. `src/lib/guidepour-redirects.mjs` (an Astro
   integration, `astro:build:done` hook, wired in `astro.config.mjs`) emits a
   `dist/<alias>/index.html` meta-refresh + canonical + `noindex,follow` stub → the
   post's `/{lang}/blog/<stem>/`. It runs inside `astro build` (CI uses
   `withastro/action`, which skips npm lifecycle scripts), and **throws** on a
   duplicate alias or an alias that collides with a real built page — old book links
   are immutable, so a silent clash must never ship.

**Why `aliases` is explicit, not derived from the filename:** the old Grav routes are
FRENCH and frequently differ from the post slug — `/metropole`→`grand-metropolien`,
`/maths`→`mathematicien`, `/jeune`→`jeune-intermittent`, `/dejavu`→`deja-vu`,
`/web5`→`web-5-0`. New Guide Pour entries stay zero-manual-work: WriterHelper writes
the post with one `aliases:` line and the stub appears on the next build.

## guidance4.com (English, later)

The EN sibling domain gets the same `* → martingamsby.com/*` forwarding. EN aliases are
seeded **as a best guess = the EN post slug** (all distinct from the FR set; `web5`
[FR] vs `web-5-0` [EN] is a deliberate split to avoid an alias collision, since both
sites forward into one shared bare-slug namespace). Confirm guidance4's real printed
slugs when that site/book is set and adjust the EN `aliases`.

## The `/{lang}/guidepour` page

`src/pages/[lang]/guidepour.astro` (mirrors `book.astro`): title "Guide pour ✳", a
lede, the **Djosh Sho bio** (ported verbatim from the Grav `author.fr.md`; EN is a
translation), an explicit **fiction note** ("Djosh Sho est un personnage de fiction…")
so a first-time reader knows it's from the novel, a Coal Ton mention, and a `PostList`
of the entries — filtered by `getGuidePourPosts(lang)` / `isGuidePour(post)` in
`src/lib/blog.ts` on the cross-language **`Djosh Sho`** tag **only** (NOT the fiction
facet — real-life-fact entries must still appear). Linked both ways with `/book` (the
book epigraph is already by Djosh Sho) and from the main nav + the friendlier `404`. No
enum/doors change. The home page also hangs a **`✳` star on the book gate** linking here
(`src/pages/[lang]/index.astro`, a `.sky-post` chip with `data-facet="book"`).

## Gaps Martin will fill (they're in the book)

- **Missing entry #06** — Grav goes `05.sleeper` → `07.web5`; no post exists for #06.
- **`/crypto`** — a hidden (`visible:false`), 2021, longer article in Grav (category
  "Argent", not Interverti) that was never published on the site. Include as a post +
  redirect, or let it fall to the friendly 404?
- **Full printed-slug list** — confirm every `guidepour.com/<slug>` the book prints so
  none dead-ends (the 16 live ones are covered).
- **guidance4 / EN slugs** — best-guess until confirmed.
- **Coal Ton** — only a name in Grav (no real bio); currently a one-line mention.

See also [[doors-as-lenses]], [[jekyll-blogs]], [[overview]].

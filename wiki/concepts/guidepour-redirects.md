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
`facets: [fiction]` posts **in both FR and EN**, tagged `Guide Pour`/`Guidance For`,
`Interverti (Roman)`/`Interverted (Novel)`, **`Djosh Sho`**, `Gamsblurb`. This was a
redirect + author-page + tag-tidy job, **not** a content migration. **Not every entry is
fiction** — 8 "Guide pour" pairs are real-life facts (agnostic, goldfish, sleeper,
deja-vu, second, hasty-generalization, mathematician, magic + FR twins) and carry **no
`Fiction` tag**. They were the ones Martin had left un-tagged before commit `d86cdbf`
("added Fiction where missing"), which wrongly added it; a one-off removed it again.
Their `facets:[fiction]` is **kept** — they're still Djosh Sho column pieces under the
Book door. WriterHelper's migration never pair-unions `Fiction` across a guidepour twin,
so it can't creep back. The `Djosh Sho` tag alone defines the column.

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

## guidance4.com (English) — separate, because slugs collide

Source of truth: `Interverti/content/interverti/en/book.draft.md` (the EN book). It uses
**"Guidance for ✳"** (not "Guide for") and prints `guidance4.com/<slug>`. The EN slugs
were updated to match it: `metropolis, fasting, sleep, web5, conferences, hypocrisy,
generalization, math, fabulist` (+ unchanged `agnostic, goldfish, homeless,
personalities, deja-vu, second, magic`). Stored in each EN post's `aliases:`.

Both domains forward `/<slug>` → `martingamsby.com/<slug>`, so the integration emits
**both** (`EMIT_LANGS = ['fr', 'en']`, FR-first). **`web5` and `conferences` are
IDENTICAL in both books** → those two slugs collide; **FR wins** (guidepour.com is
live/primary), the EN stub is skipped with a build warning, and `guidance4.com/web5`
lands on the French post (language toggle = escape). Same-language duplicate aliases
still **throw** (real bug). Last build: 30 stubs (16 FR + 14 EN-only). Perfect
per-language landing for those 2 would need guidance4.com on its own host.

The EN book has **17 entries with NO post** (confirmed gaps — searched, none exist):
bicycle, bunker, backward-compatibility, end-of-the-world, adrenaline, cows, old, music,
flaws, tesla, wisdom, mozart, everyone, einstein, resilience, newton, slaves — their
texts are in the book if Martin wants them generated (EN-only unless the FR book is
provided for twins).

5 EN posts were **retitled to the book's entry titles** (Martin's call): Sleeper→**Sleep**,
Conference→**Conferences**, Hypocritical→**Hypocrite**, Mathematician→**Regression**,
Fabulator→**Fabulist** (FR twin titles left as-is — needs the FR book to align).

## The `/{lang}/guidepour` page

`src/pages/[lang]/guidepour.astro` (mirrors `book.astro`): title "Guide pour ✳", a
lede, the **Djosh Sho bio** (FR ported verbatim from the Grav `author.fr.md`; EN is the
exact text from the EN book, ch. 10), an explicit **fiction note** ("Djosh Sho est un personnage de fiction…")
so a first-time reader knows it's from the novel, a Coal Ton mention, and a `PostList`
of the entries — filtered by `getGuidePourPosts(lang)` / `isGuidePour(post)` in
`src/lib/blog.ts` on the cross-language **`Djosh Sho`** tag **only** (NOT the fiction
facet — real-life-fact entries must still appear). Linked both ways with `/book` (the
book epigraph is already by Djosh Sho) and from the main nav + the friendlier `404`. No
enum/doors change. Entries render as **"Guide pour *title*" / "Guidance for *title*"**
(`PostList`'s `titlePrefix` prop). The home page also hangs a **`✳` star on the book
gate** linking here (`src/pages/[lang]/index.astro`, a `.sky-post` chip with
`data-facet="book"`).

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

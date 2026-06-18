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

## Two books, 33 entries, both source-of-truth

- **FR (immutable, published):** `Interverti/content/interverti/fr/book.md` — "Guide pour ✳",
  prints `guidepour.com/<slug>`.
- **EN (draft, NOT yet published → mutable):** `Interverti/content/interverti/en/book.draft.md`
  — "Guidance for ✳", prints `guidance4.com/<slug>`.

Both books have the **same 33 entries in the same order**. 16 already had posts; the
**17 new ones were generated from the book text** (FR+EN twins): bicyclette/bicycle,
hangar/bunker, rétrocompatibilité/backward-compatibility, fin-du-monde/end-of-the-world,
adrénaline, vaches/cows, vieux/old, musique/music, défauts/flaws, tesla, sagesse/wisdom,
mozart, tout-le-monde/everyone, einstein, résilience, newton, esclaves/slaves. The
existing 16 bodies were **synced to the current book text** (the books had been edited
since the .md were first made), single-block where the book is single-block.

**Dates (fake — real ones unknown):** new entries placed in **book order** — the 6 before
Magie get in-between dates (2016-03-15 … 2017-04-20), the 11 after Magie get daily dates
2017-05-02 … 2017-05-12. Existing dates kept (re-dating them would break the old Jekyll
redirect stubs). One quirk: the existing Régression(`maths`, 2017-03) sits later than book
order wants — left as-is.

**Titles retitled to the books** (Martin's call): FR Dormeur→**Sommeil**,
Conférencier→**Conférences**, Mathématicien→**Régression**; EN Sleeper→**Sleep**,
Conference→**Conferences**, Hypocritical→**Hypocrite**, Mathematician→**Regression**,
Fabulator→**Fabulist** (+ case fixes). **Fixed 2 wrong FR aliases** vs the immutable FR
book: `dormeur`→**sommeil**, `dejavu`→**deja-vu**.

## Collisions — resolved by renaming 9 EN slugs

Both domains forward `/<slug>` → `martingamsby.com/<slug>`, so the integration emits
**both** (`EMIT_LANGS = ['fr', 'en']`) and **throws on ANY duplicate alias** (no
silent collisions). The FR book and the EN book once shared **9 slugs** (proper nouns +
cognates). Since the EN book is a draft (**not printed → mutable**, Martin's call), those
9 were **renamed on the EN side** — in both the EN posts' `aliases:` and the EN
`book.draft.md`:

| FR (immutable) | EN was | EN now |
|---|---|---|
| web5 | web5 | **web-5-0** |
| conferences | conferences | **conference** |
| deja-vu | deja-vu | **dejavu** |
| adrenaline | adrenaline | **adrenalin** |
| tesla | tesla | **nikola-tesla** |
| mozart | mozart | **wolfgang-mozart** |
| einstein | einstein | **albert-einstein** |
| resilience | resilience | **resiliency** |
| newton | newton | **isaac-newton** |

Now every slug is unique → both FR `/tesla` and EN `/nikola-tesla` land correct-language.
Last build: **66 stubs** (33 FR + 33 EN), 0 collisions.

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

## Open items

- **`/crypto`** — a hidden (`visible:false`), 2021, longer article that was in the old Grav
  site (category "Argent") but is NOT a book "Guide pour" entry and not on the site. Make a
  post + redirect, or let `guidepour.com/crypto` fall to the friendly 404? (The old Grav
  `06.*` folder gap is a non-issue — both books have exactly 33 entries, all now covered.)
- **Régression date quirk** — the existing `maths`/`math` post (2017-03) sits later than its
  book-order position; re-dating it would break the old Jekyll redirect stub, so left as-is.
- **Coal Ton** — only a name (no real bio); currently a one-line mention on `/guidepour`.

See also [[doors-as-lenses]], [[jekyll-blogs]], [[overview]].

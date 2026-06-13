# WriterHelper — the authoring pipeline

The **deterministic** tool Martin writes and translates posts with. NOT a
Claude skill, NOT a script in this repo — a standing Python/Qt app in the
sibling repo `C:\Users\Martin\Documents\GitHub\WriterHelper`. Run with
`python writerhelper.py`.

How it works: a model → template → file pipeline. Each article is an
`ArticleModel`; on any field change it re-serializes the full markdown and
`filemanager.ContentFile.create_file` writes `<date>-<slug>.md`. It writes BOTH
language files of a pair, auto-translates (Google Translate via deep_translator),
and posts to X/Bluesky. WriterHelper keeps its own Karpathy-style Memory in
`WriterHelper/memory/` — read that, don't re-derive its internals.

**Today it emits the Jekyll format** into the two old blog `_posts/` folders.
To feed this Astro site it must learn the new frontmatter
(`translationKey`/`facets`/`draft`, no `### **title**` body heading, no
`ref:`/`categories`). The migration plan for that lives at
`WriterHelper/PLAN_ASTRO_FORMAT.md` (proposed 2026-06-12): a `PostSerializer`
seam with Jekyll + Astro implementations, dual-write during the transition,
sticky `translationKey`, twin-lookup by key scan. Three decisions await Martin
(dual-write vs hard switch; which URL social posts share during transition;
drop `categories`).

Implication for THIS repo: a `new-post` **skill** was created in error on
2026-06-12 and removed — authoring is deterministic, never a Claude skill. The
`tools/new-post.mjs` **script** stays: it's a fine low-level helper WriterHelper
(or a human) can call to scaffold the FR/EN pair. The schema carries
`image:`/`imageThumb:` (both `z.string().optional()` in `src/content.config.ts`).

**Image contract (2026-06-13):** post preview images are self-hosted, never
hot-linked. WriterHelper may write `image:` as any URL (its Vercel-blob preview,
xkcd, etc.), but **after writing the `.md` it MUST run
`node tools/localize-images.mjs --file <that post.md>`** (added 2026-06-13). That
tool downloads the image, emits `public/assets/posts/<sha1>.{header,thumb}.webp`
(≤1200px hero + 160px cover thumbnail), and rewrites the frontmatter to local
`image:`+`imageThumb:`. It's idempotent and twin-deduped, so calling it once per
file (or a bulk no-arg backfill) is safe. When WriterHelper becomes the in-repo
web app, fold this call into its save step.

**Future direction (deferred — Martin, 2026-06-12):** rather than keep WriterHelper
a separate Qt app that writes files into this repo, fold it INTO martingamsby.com
as a web app. Martin already started a web conversion (there's a `web/` folder and
`webapi.py` in the WriterHelper repo) and thinks the Astro site is a better base
for a second attempt. Explicitly NOT this session (session too long). When picked
up: evaluate reusing the Astro/Vite stack here vs. the existing `webapi.py`.

Related: [[jekyll-blogs]] (the format WriterHelper writes today + the migration
source), [[bilingual-routing]] (translationKey pairing it must produce).

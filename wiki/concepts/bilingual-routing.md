# Bilingual routing

The #1 pain of the current setup: FR and EN blogs are two unrelated sites
([[jekyll-blogs]]) with no per-article cross-links. The new site fixes this:

- Mirrored routes `/fr/…` and `/en/…` (Astro i18n). Root `/` redirects by browser
  language, remembering the visitor's choice (localStorage).
- **Every page knows its twin**: the FR/EN toggle lands on the equivalent page.
  Posts pair via a `translationKey` in frontmatter, assigned at migration time.
  FR/EN posts pair almost 1:1 by date; a script proposes the mapping, stragglers
  fixed by hand. Posts existing in only one language: toggle falls back to that
  language's blog index with a note.
- `hreflang` alternates on every page; per-language RSS and sitemap.
- YouTube embeds are language-aware: FR channel on /fr pages, EN channel on /en
  (see [[profiles-and-channels]]).

Quebec-French voice: when touching FR text, keep Martin's colloquial tone; migration
never rewrites post content, only frontmatter.

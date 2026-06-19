# Wiki Index

Read this first; open only the pages you need.

## Synthesis
- [[overview]] — what this project is and where it stands.

## Concepts
- [[doors-as-lenses]] — the core design concept: audience doors filter one content pool, never silo it.
- [[featured-stars]] — each home gate hangs one representative post as a "star"; chosen by a manual popularity table (src/data/post-popularity.json) + on-demand fetch script (YouTube/Bluesky auto; X & other login-walled platforms read from the browser by the `/popularity` skill via `--import`), falling back to most-recent-with-image.
- [[related-constellation]] — every post ends with a mini-constellation of related posts (shared tags + facet, sized by popularity); shared `StarMap.astro` component.
- [[tag-galaxy]] — `/[lang]/tags`: every reused tag is a star sized by frequency, coloured by dominant facet, click-to-filter the posts.
- [[guidepour-redirects]] — retiring guidepour.com (+ future guidance4.com): bare-slug redirect stubs from an `aliases` frontmatter field + build integration, and the `/{lang}/guidepour` Djosh Sho author page.
- [[bilingual-routing]] — mirrored /fr + /en routes, translationKey pairing, hreflang.
- [[link-icons]] — one royalty-free icon pack (Font Awesome Free) for every external/social link.

## Sources (Martin's existing properties)
- [[jekyll-blogs]] — the two "Gamsblurbs" Jekyll blogs (FR + EN) being migrated in.
- [[github-repos-and-demos]] — public/private repos and the employer Hugging Face demo.
- [[profiles-and-channels]] — full per-language socials table (X, Bluesky, YouTube, Facebook, Typeshare), ORCID, LinkedIn, CV, linktrees, contact-email stance, the dead WordPress.
- [[physics-preprint]] — the Zenodo record (paper + code, DOI 10.5281/zenodo.20482196) for the physics door.
- [[writerhelper]] — the deterministic authoring app that writes posts into the site (replaces the erroneous new-post script).

## Operations
- [[log]] — append-only timeline of wiki operations.

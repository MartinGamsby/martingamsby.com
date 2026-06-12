---
name: new-post
description: Create a new bilingual blog post pair (FR + EN) with a shared translationKey. Use when Martin wants to write/add/start a new blog post, billet, or article on the site.
---

# New bilingual post

Every post exists in both languages, paired by `translationKey`. Never create one
language without at least stubbing the other (the language toggle depends on it).

## Steps

1. Get both titles (FR and EN). If Martin gave only one, draft the other and confirm.
2. Run the generator from the repo root:
   ```
   npm run new-post -- --fr "Titre du billet" --en "Post title" --facets dev,ideas
   ```
   Optional: `--date YYYY-MM-DD` (defaults to today), `--key custom-translation-key`.
   Valid facets: `dev`, `physics`, `fiction`, `music`, `ideas` (see
   `src/content.config.ts`; a post can have several — doors filter on them).
3. The script creates `src/content/blog/fr/<date>-<slug>.md` and
   `src/content/blog/en/<date>-<slug>.md` with `draft: true`.
4. Write/paste the content. Keep Martin's colloquial Quebec-French voice in FR;
   his posts are typically short ("Gamsblurbs"), often ending with a `---` and a
   link to the matching X/Twitter thread (FR account @MartinGamsby, EN @Martin_Gamsby).
5. Remove the `draft: true` line from both files when ready to publish.
6. `npm run build` to verify, then commit. Pushing to `main` deploys automatically.

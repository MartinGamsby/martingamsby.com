# martingamsby.com

Martin Gamsby's unified bilingual personal site — Astro, deployed to GitHub Pages
on every push to `main`.

- **Plan & decisions**: [PLAN.md](PLAN.md)
- **Agent instructions**: [CLAUDE.md](CLAUDE.md) · project knowledge in [wiki/](wiki/index.md)

## Commands

| Command | Action |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run new-post -- --fr "Titre" --en "Title"` | Create a paired FR+EN post |

## Structure

- `src/content/blog/{fr,en}/` — posts (twins share a `translationKey`)
- `src/pages/[lang]/` — mirrored FR/EN routes (home, doors, blog, about, links)
- `src/i18n/ui.ts` — UI strings + URL/base helpers
- `wiki/` — agent-maintained project knowledge (Karpathy LLM-wiki pattern)

---
name: llm-wiki
description: Maintain the project's Karpathy-style LLM wiki in wiki/ — ingest new knowledge, query the knowledge base, or lint it for rot. Use when the user says "ingest", "add to the wiki", "what do we know about…", "lint the wiki", or whenever durable project knowledge (a decision, fact, or hard-won constraint) is learned and should outlive the session.
---

# LLM Wiki (Karpathy pattern)

The wiki at `wiki/` is an agent-maintained, interlinked markdown knowledge base.
You own it entirely; the human curates sources and direction. Knowledge compounds:
every ingest makes future sessions smarter. Pattern reference:
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## Layout

```
raw/              # immutable source materials — read, never modify
wiki/
  index.md        # catalog: every page, one-line summary, grouped by category — read this FIRST
  log.md          # append-only timeline: ## [YYYY-MM-DD] operation | description
  overview.md     # synthesis across everything
  concepts/       # design concepts, recurring ideas
  sources/        # one page per external property/source (a repo, a blog, a profile)
  entities/       # people, organizations, tools (create the folder when first needed)
```

## Conventions

- Cross-reference with wikilinks: `[[page-name]]` (the target's filename without `.md`).
  Link liberally; a link to a not-yet-written page marks future work, not an error.
- Filenames: short kebab-case. One fact-cluster per page; split pages that sprawl.
- Pages may carry YAML frontmatter (`tags`, `updated`); keep it light.
- Preserve tensions: if two sources disagree, record both with a note — don't
  silently reconcile subjective questions.
- `log.md` entries are grep-able: `## [2026-06-11] ingest | short description`.

## Workflows

**Ingest** (new source or new durable fact):
1. Read the source (or take the fact from conversation).
2. Write/update the relevant page(s) — a single ingest may touch several pages.
3. Cross-link from related pages; add/update the `index.md` entry.
4. Append one `log.md` line.
Durable = decisions, properties of Martin's accounts/repos/sites, constraints
discovered the hard way. NOT session-local trivia or anything already in PLAN.md
(link to PLAN.md instead of duplicating it).

**Query** ("what do we know about X"):
1. Read `index.md`, open only the relevant pages.
2. Answer with page references. If the exploration produced new synthesis worth
   keeping, file it as a page (that's compounding) and log it.

**Lint** (periodic health check):
- Orphan pages (nothing links to them, not in index) → index or merge them.
- Stale claims (e.g. "repo is private" — re-verify cheap facts) → update with date.
- Broken wikilinks pointing at pages that should exist by now → write the page or fix the link.
- Contradictions → flag for the user, don't auto-resolve subjective ones.
- Report findings; apply only the objective fixes autonomously.

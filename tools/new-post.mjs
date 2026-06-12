// Creates a paired FR+EN blog post with a shared translationKey.
// Usage:
//   npm run new-post -- --fr "Titre du billet" --en "Post title" [--facets dev,ideas] [--date 2026-06-12]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FACETS = ['dev', 'physics', 'fiction', 'music', 'ideas'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];
  }
  return args;
}

function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents left by NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const args = parseArgs(process.argv.slice(2));
if (!args.fr || !args.en) {
  console.error('Both titles are required: --fr "Titre" --en "Title"');
  process.exit(1);
}
const date = args.date ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`--date must be YYYY-MM-DD, got: ${date}`);
  process.exit(1);
}
const facets = (args.facets ?? '').split(',').map((f) => f.trim()).filter(Boolean);
const bad = facets.filter((f) => !FACETS.includes(f));
if (bad.length) {
  console.error(`Unknown facet(s): ${bad.join(', ')}. Valid: ${FACETS.join(', ')}`);
  process.exit(1);
}
const key = args.key ?? `${date}-${slugify(args.en)}`;

const files = [
  { lang: 'fr', title: args.fr },
  { lang: 'en', title: args.en },
].map(({ lang, title }) => ({
  path: path.join(root, 'src', 'content', 'blog', lang, `${date}-${slugify(title)}.md`),
  content: `---
title: "${title.replace(/"/g, '\\"')}"
date: ${date}
translationKey: ${key}
facets: [${facets.join(', ')}]
tags: []
draft: true
---

`,
}));

for (const f of files) {
  if (fs.existsSync(f.path)) {
    console.error(`Already exists, not overwriting: ${f.path}`);
    process.exit(1);
  }
}
for (const f of files) {
  fs.mkdirSync(path.dirname(f.path), { recursive: true });
  fs.writeFileSync(f.path, f.content, 'utf8');
  console.log(`Created ${path.relative(root, f.path)}`);
}
console.log(`translationKey: ${key}`);
console.log('Both files are draft: true — remove the line when ready to publish.');

// Tag-galaxy data ([[tag-galaxy]]): every reused tag becomes a star sized by how often
// it's used and coloured by its dominant facet — derived entirely from post data at
// build time (no separate config). The house tag is excluded (it's on every post) and
// pure one-offs are dropped, so the galaxy shows the controlled, reused vocabulary.
import { FACET_GATE, getPosts, type Facet } from './blog';
import type { Lang } from '../i18n/ui';
import type { Gate } from '../data/social-constellation';

const HOUSE_TAG = 'Gamsblurb';

export interface TagStar {
  tag: string;
  count: number;
  gate: Gate;        // colour = the facet this tag appears with most often
}

export async function getTagStars(lang: Lang, minCount = 2, limit = 28): Promise<TagStar[]> {
  const posts = await getPosts(lang);
  const freq = new Map<string, number>();
  const facetHits = new Map<string, Map<Facet, number>>();

  for (const p of posts) {
    const tags = [...new Set(p.data.tags)].filter((tg) => tg !== HOUSE_TAG);
    for (const tag of tags) {
      freq.set(tag, (freq.get(tag) ?? 0) + 1);
      let fm = facetHits.get(tag);
      if (!fm) { fm = new Map(); facetHits.set(tag, fm); }
      for (const f of p.data.facets) fm.set(f, (fm.get(f) ?? 0) + 1);
    }
  }

  const stars: TagStar[] = [...freq.entries()].map(([tag, count]) => {
    const fm = facetHits.get(tag)!;
    let best: Facet | undefined;
    let bestN = -1;
    for (const [f, n] of fm) if (n > bestN) { bestN = n; best = f; }
    return { tag, count, gate: best ? FACET_GATE[best] : 'everything' };
  });

  return stars
    .filter((s) => s.count >= minCount)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

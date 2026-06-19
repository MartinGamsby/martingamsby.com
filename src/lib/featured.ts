// Pick one representative "star" post per home-page gate.
//
// A gate is a lens over a facet (see doors-as-lenses): `book` shows the
// `fiction` facet, `everything` shows the whole pool, the rest map 1:1.
// Each gate's star is the highest-TRENDING post in its facet: trendingScore =
// recency-decayed popularity (score from the table in src/data/post-popularity.json,
// keyed by translationKey so it covers both FR/EN twins). With no scores the sort
// degrades to "most-recent post" (recency dominates), then has-image, so the feature
// works before the table is populated. Stars are de-duped across gates so no post repeats.
import popularityRaw from '../data/post-popularity.json';
import { getPosts, type Post, type Facet } from './blog';
import { trendingValue } from './trending.mjs';
import type { Lang } from '../i18n/ui';
import type { Gate } from '../data/social-constellation';

// translationKey -> effective score. Ignores `_readme`/comment keys and any
// malformed entry, so a hand-edited JSON can't break the build.
const popularity: Record<string, number> = Object.fromEntries(
  Object.entries(popularityRaw as Record<string, unknown>)
    .filter(
      (entry): entry is [string, { score: number }] =>
        !entry[0].startsWith('_') &&
        typeof entry[1] === 'object' &&
        entry[1] !== null &&
        typeof (entry[1] as { score?: unknown }).score === 'number',
    )
    .map(([k, v]) => [k, v.score]),
);

export function scoreOf(post: Post): number {
  return popularity[post.data.translationKey] ?? 0;
}

// trendingScore = recency-decayed popularity — the gate stars, related constellation
// and tag galaxy all rank by it. The decay curve lives in ./trending.mjs (the single
// source shared with tools/fetch-popularity.mjs, so the CLI preview can't drift from it).
export function trendingScore(post: Post, now: number = Date.now()): number {
  return trendingValue(scoreOf(post), (now - post.data.date.getTime()) / 86_400_000);
}

// Gates are lenses over facets. `book` == the fiction facet; `everything` == all.
export const GATE_FACET: Record<Gate, Facet | null> = {
  book: 'fiction',
  dev: 'dev',
  music: 'music',
  physics: 'physics',
  everything: null,
};

export interface GateFeature {
  gate: Gate;
  post: Post;
}

/**
 * One representative post per gate, in the given gate order. Sort key per gate:
 * trendingScore desc (recency-decayed popularity — so a high-engagement post fades
 * over time and a fresh one out-ranks an equal-but-older one) → has-image desc →
 * date desc. De-duped across gates (a post featured by an earlier gate is skipped by
 * later ones), so the `everything` gate — listed last — picks the top post not shown.
 */
export async function getGateFeatures(lang: Lang, gates: Gate[]): Promise<GateFeature[]> {
  const all = await getPosts(lang); // newest-first, drafts excluded
  const used = new Set<string>();
  const out: GateFeature[] = [];
  const now = Date.now();

  for (const gate of gates) {
    const facet = GATE_FACET[gate];
    const pool = all.filter(
      (p) => !used.has(p.data.translationKey) && (facet === null || p.data.facets.includes(facet)),
    );
    if (!pool.length) continue;
    pool.sort((a, b) => {
      const byTrend = trendingScore(b, now) - trendingScore(a, now);
      if (byTrend) return byTrend;
      const byImage = Number(!!b.data.image) - Number(!!a.data.image);
      if (byImage) return byImage;
      return b.data.date.getTime() - a.data.date.getTime();
    });
    const post = pool[0];
    used.add(post.data.translationKey);
    out.push({ gate, post });
  }
  return out;
}

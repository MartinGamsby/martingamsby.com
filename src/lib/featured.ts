// Pick one representative "star" post per home-page gate.
//
// A gate is a lens over a facet (see doors-as-lenses): `book` shows the
// `fiction` facet, `everything` shows the whole pool, the rest map 1:1.
// Each gate's star is the highest-scored post in its facet — score comes from
// the MANUAL popularity table in src/data/post-popularity.json (keyed by
// translationKey, so a score covers both FR/EN twins). With no scores the sort
// degrades to "most-recent post that has an image", so the feature works before
// the table is populated. Stars are de-duped across gates so no post repeats.
import popularityRaw from '../data/post-popularity.json';
import { getPosts, type Post, type Facet } from './blog';
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
 * popularity score desc → has-image desc → date desc. De-duped across gates
 * (a post featured by an earlier gate is skipped by later ones), so the
 * `everything` gate — listed last — picks the top post not already shown.
 */
export async function getGateFeatures(lang: Lang, gates: Gate[]): Promise<GateFeature[]> {
  const all = await getPosts(lang); // newest-first, drafts excluded
  const used = new Set<string>();
  const out: GateFeature[] = [];

  for (const gate of gates) {
    const facet = GATE_FACET[gate];
    const pool = all.filter(
      (p) => !used.has(p.data.translationKey) && (facet === null || p.data.facets.includes(facet)),
    );
    if (!pool.length) continue;
    pool.sort((a, b) => {
      const byScore = scoreOf(b) - scoreOf(a);
      if (byScore) return byScore;
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

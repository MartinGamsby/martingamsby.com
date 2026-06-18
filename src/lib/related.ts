// Related posts for the per-post constellation ([[related-constellation]]).
//
// Relatedness is deterministic — the same "shared tags" signal the WriterHelper picker
// uses to suggest tags, here turned into reader-facing navigation. A candidate is
// ranked by: shared tags (the house tag is ignored — it's on every post), then shared
// facets, then manual popularity (scoreOf), then recency. The popularity table breaks
// ties so the home constellation and these mini-maps agree on what's "big".
import { getPosts, type Post } from './blog';
import { scoreOf } from './featured';
import type { Lang } from '../i18n/ui';

const HOUSE_TAG = 'Gamsblurb';

export interface Related {
  post: Post;
  sharedTags: number;
  sharedFacets: number;
}

export async function getRelatedPosts(post: Post, lang: Lang, limit = 8): Promise<Related[]> {
  const myTags = new Set(post.data.tags.filter((tg) => tg !== HOUSE_TAG));
  const myFacets = new Set<string>(post.data.facets);
  const candidates = (await getPosts(lang)).filter(
    (p) => p.data.translationKey !== post.data.translationKey,
  );

  const scored: Related[] = candidates.map((p) => ({
    post: p,
    sharedTags: p.data.tags.filter((tg) => tg !== HOUSE_TAG && myTags.has(tg)).length,
    sharedFacets: p.data.facets.filter((f) => myFacets.has(f)).length,
  }));

  return scored
    .filter((r) => r.sharedTags > 0 || r.sharedFacets > 0)
    .sort(
      (a, b) =>
        b.sharedTags - a.sharedTags ||
        b.sharedFacets - a.sharedFacets ||
        scoreOf(b.post) - scoreOf(a.post) ||
        b.post.data.date.getTime() - a.post.data.date.getTime(),
    )
    .slice(0, limit);
}

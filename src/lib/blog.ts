import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import type { Gate } from '../data/social-constellation';

export type Post = CollectionEntry<'blog'>;
export type Facet = Post['data']['facets'][number];

// A facet maps to a home-gate colour bucket (the same hues the constellation uses):
// fiction shows under the "book" gate, ideas has no dedicated colour so it takes the
// neutral "everything" accent, the rest map 1:1. See [[doors-as-lenses]].
export const FACET_GATE: Record<Facet, Gate> = {
  dev: 'dev',
  physics: 'physics',
  fiction: 'book',
  music: 'music',
  ideas: 'everything',
};

/** The colour gate for a set of facets: the preferred facet's gate if present,
 *  else the first facet's, else the neutral 'everything'. */
export function gateOf(facets: readonly Facet[], prefer?: Facet): Gate {
  const f = prefer && facets.includes(prefer) ? prefer : facets[0];
  return f ? FACET_GATE[f] : 'everything';
}

// Entry ids look like "fr/2026-01-23-le-killer-feature..." — folder = language.
export function langOf(post: Post): Lang {
  return post.id.split('/')[0] as Lang;
}

export function slugOf(post: Post): string {
  return post.id.split('/').slice(1).join('/');
}

export async function getPosts(lang: Lang, facet?: Facet): Promise<Post[]> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all
    .filter((p) => langOf(p) === lang)
    .filter((p) => !facet || p.data.facets.includes(facet))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// The "Guide pour *" entries — the in-universe column by the fictional Djosh Sho
// (from the novel Interverti), originally hosted on guidepour.com. Tagged in both
// languages with "Djosh Sho", so that single tag is the cross-language filter.
export function isGuidePour(post: Post): boolean {
  return post.data.tags.includes('Djosh Sho');
}

export async function getGuidePourPosts(lang: Lang): Promise<Post[]> {
  const posts = await getPosts(lang, 'fiction');
  return posts.filter(isGuidePour);
}

export async function findTwin(post: Post): Promise<Post | undefined> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all.find(
    (p) => p.data.translationKey === post.data.translationKey && langOf(p) !== langOf(post),
  );
}

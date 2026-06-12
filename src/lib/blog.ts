import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Post = CollectionEntry<'blog'>;
export type Facet = Post['data']['facets'][number];

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

export async function findTwin(post: Post): Promise<Post | undefined> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all.find(
    (p) => p.data.translationKey === post.data.translationKey && langOf(p) !== langOf(post),
  );
}

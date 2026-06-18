import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One pool of posts; language comes from the folder (fr/ or en/ in the entry id),
// twins share a translationKey, and doors filter on facets — never silo.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    translationKey: z.string(),
    facets: z.array(z.enum(['dev', 'physics', 'fiction', 'music', 'ideas'])).default([]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Extra short URLs this post answers to (no leading slash), e.g. the old
    // guidepour.com slug for a Guide Pour entry. The build emits a bare-slug
    // meta-refresh redirect per alias -> this post (see the guidepourRedirects
    // integration in astro.config.mjs). Kept explicit because old slugs are
    // printed in the book and rarely match the filename (/metropole != grand-metropolien).
    aliases: z.array(z.string()).default([]),
    // Optional preview/OG image (Jekyll `excerpt_image` at migration; WriterHelper `image`).
    // After `tools/localize-images.mjs` runs, `image` is the local large/header webp
    // and `imageThumb` the small list-thumbnail webp (both under /assets/posts/).
    image: z.string().optional(),
    imageThumb: z.string().optional(),
  }),
});

export const collections = { blog };

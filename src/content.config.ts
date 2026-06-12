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
  }),
});

export const collections = { blog };

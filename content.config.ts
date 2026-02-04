import { defineCollection, defineContentConfig, z } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        image: z.string().optional(),
        authors: z
          .array(
            z.object({
              name: z.string(),
              avatar: z.string().optional(),
            }),
          )
          .optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
      }),
    }),
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        navigation: z
          .object({
            title: z.string().optional(),
            icon: z.string().optional(),
            order: z.number().optional(),
          })
          .optional(),
      }),
    }),
    legal: defineCollection({
      type: 'page',
      source: 'legal/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        lastUpdated: z.coerce.date(),
      }),
    }),
    changelog: defineCollection({
      type: 'page',
      source: 'changelog/**/*.md',
      schema: z.object({
        version: z.string(),
        date: z.coerce.date(),
        title: z.string(),
        description: z.string(),
        type: z.enum(['major', 'minor', 'patch']).default('minor'),
        changes: z
          .array(
            z.object({
              type: z.enum(['feature', 'fix', 'improvement']),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    }),
  },
});

import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

/**
 * Content contracts for the whole site.
 *
 * These schemas are a shared contract: page templates read them and content
 * files must satisfy them. Treat changes here as breaking changes.
 */

/** A headline number, e.g. "10s → 2.5s" / "checkout latency". */
const metric = z.object({
  value: z.string(),
  label: z.string(),
  /** Optional longer form shown on the case-study page. */
  detail: z.string().optional(),
});

const entries = defineCollection({
  loader: glob({ base: './src/content/entries', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Short line under the title on the card. */
      blurb: z.string(),
      /** Both kinds of content share one shape: work and off-the-clock entries. */
      category: z.enum(['work', 'off-the-clock']),
      /** 'deep-dive' gets the full case-study treatment; 'summary' gets a short page. */
      treatment: z.enum(['deep-dive', 'summary']),
      tags: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      metrics: z.array(metric).default([]),
      role: z.string().optional(),
      org: z.string().optional(),
      period: z.string().optional(),
      /** Emoji or short glyph used as the card's visual anchor. */
      glyph: z.string().optional(),
      featured: z.boolean().default(true),
      /** Lower sorts first within its category. */
      order: z.number(),
      /** True when the work belongs to an employer and copy must stay within public claims. */
      confidential: z.boolean().default(false),
      draft: z.boolean().default(false),
      /** Optional lead image, resolved and optimised by astro:assets. */
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      /** Optional screenshot gallery. Every entry needs real alt text. */
      gallery: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
        .default([]),
    }),
});

const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    period: z.string(),
    location: z.string(),
    /** ISO-ish sort key, newest first: use the start date, e.g. "2022-01". */
    startDate: z.string(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    /** Expanded by default in the timeline; older roles collapse to one line. */
    expanded: z.boolean().default(false),
  }),
});

const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    // NOTE: leading-underscore files are NOT excluded by the glob loader in
    // Astro 7 - _template.mdx IS loaded into this collection. It carries
    // draft: true, so every consumer MUST filter explicitly:
    //   getCollection('posts', ({ data }) => !data.draft)
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { entries, experience, posts };

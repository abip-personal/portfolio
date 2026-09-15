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

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    /** Short line under the title on the card. */
    blurb: z.string(),
    role: z.string(),
    org: z.string(),
    period: z.string(),
    /** 'deep-dive' gets the full case-study treatment; 'summary' gets a short page. */
    treatment: z.enum(['deep-dive', 'summary']),
    stack: z.array(z.string()),
    metrics: z.array(metric).default([]),
    featured: z.boolean().default(true),
    /** Lower sorts first on the home page. */
    order: z.number(),
    /** True when the work belongs to an employer and copy must stay within public claims. */
    confidential: z.boolean().default(false),
    draft: z.boolean().default(false),
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

const hobbies = defineCollection({
  loader: glob({ base: './src/content/hobbies', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    /** Emoji or short glyph used as the card's visual anchor. */
    glyph: z.string().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number(),
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

export const collections = { projects, experience, hobbies, posts };

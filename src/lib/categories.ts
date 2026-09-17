/**
 * Single source of truth for the two content categories: 'work' and
 * 'off-the-clock'.
 *
 * Routers, href builders and page copy all read from here, so the two
 * categories can never drift apart. The 'work' copy is lifted verbatim from
 * the pre-refactor index and detail pages; change a string here once, not in
 * each page that uses it.
 */
import type { CollectionEntry } from 'astro:content';

type Treatment = 'deep-dive' | 'summary';

export interface Category {
  slug: 'work' | 'off-the-clock';
  /** URL prefix for the category's entries and index. */
  base: '/work/' | '/off-the-clock/';
  label: 'Work' | 'Off the clock';
  /** Eyebrow on a single entry page, by treatment. */
  detailEyebrow: Record<Treatment, string>;
  /** Label on the "back" link from a single entry page to the index. */
  backLabel: 'All work' | 'Off the clock';
  index: {
    eyebrow: string;
    title: string;
    intro: string;
    deepDive: { eyebrow: string; heading: string; description?: string };
    summary: { eyebrow: string; heading: string; description?: string };
  };
}

export const work: Category = {
  slug: 'work',
  base: '/work/',
  label: 'Work',
  detailEyebrow: { 'deep-dive': 'Case study', summary: 'Selected work' },
  backLabel: 'All work',
  index: {
    eyebrow: 'Selected work',
    title: 'Systems I designed, built and had to operate',
    intro:
      'Four pieces of work, written up the way I would talk through them: the constraints that were fixed before I started, what I chose, what the alternatives cost, and what I would do differently.',
    deepDive: {
      eyebrow: 'The long read',
      heading: 'Case studies',
      description: 'Full write-ups, architecture diagrams included.',
    },
    summary: {
      eyebrow: 'Also worth knowing',
      heading: 'Shorter write-ups',
    },
  },
};

export const offTheClock: Category = {
  slug: 'off-the-clock',
  base: '/off-the-clock/',
  label: 'Off the clock',
  detailEyebrow: { 'deep-dive': 'Deep dive', summary: 'Off the clock' },
  backLabel: 'Off the clock',
  index: {
    eyebrow: 'Off the clock',
    title: 'Things I build when the clock stops',
    intro:
      'The same instincts, pointed at a house instead of a platform: the constraints I actually live with, what I chose, why the alternatives cost me, and what I would do differently.',
    deepDive: {
      eyebrow: 'The long read',
      heading: 'Deep dives',
      description: 'Full write-ups, from the hardware up.',
    },
    summary: {
      eyebrow: 'Also worth knowing',
      heading: 'Shorter write-ups',
      description: 'A quick look at the rest.',
    },
  },
};

export const categories: Record<Category['slug'], Category> = {
  work,
  'off-the-clock': offTheClock,
};

export function entryHref(entry: Pick<CollectionEntry<'entries'>, 'id' | 'data'>): string {
  return `${categories[entry.data.category].base}${entry.id}/`;
}

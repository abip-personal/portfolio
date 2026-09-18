import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { ogResponse, type OgCard } from '@/lib/og';
import { categories } from '@/lib/categories';

/** Static — every card is rendered once at build time. */
export const prerender = true;

/**
 * One card per entry and per published post, at:
 *   /og/entries/<id>.png
 *   /og/posts/<id>.png
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('entries', ({ data }) => !data.draft);
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return [
    ...entries.map((entry) => ({
      params: { slug: `entries/${entry.id}` },
      props: {
        card: {
          title: entry.data.title,
          eyebrow: categories[entry.data.category].detailEyebrow[entry.data.treatment],
          subtitle: entry.data.blurb,
        } satisfies OgCard,
      },
    })),
    ...posts.map((entry) => ({
      params: { slug: `posts/${entry.id}` },
      props: {
        card: {
          title: entry.data.title,
          eyebrow: 'Writing',
          subtitle: entry.data.description,
        } satisfies OgCard,
      },
    })),
  ];
};

export const GET: APIRoute = ({ props }) => ogResponse(props.card as OgCard);

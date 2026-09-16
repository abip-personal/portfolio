import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { ogResponse, type OgCard } from '@/lib/og';

/** Static — every card is rendered once at build time. */
export const prerender = true;

/**
 * One card per project and per published post, at:
 *   /og/projects/<id>.png
 *   /og/posts/<id>.png
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return [
    ...projects.map((entry) => ({
      params: { slug: `projects/${entry.id}` },
      props: {
        card: {
          title: entry.data.title,
          eyebrow: entry.data.org,
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

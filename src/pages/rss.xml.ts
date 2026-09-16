import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@/data/site';

/** Static — the feed is written once at build time. */
export const prerender = true;

export const GET: APIRoute = async (context) => {
  // Builds cleanly against an empty `posts` collection.
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const items = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    }));

  return rss({
    title: `${SITE.name} — Writing`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>${SITE.locale}</language>`,
  });
};

import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

/**
 * robots.txt is generated rather than shipped as a static `public/` file.
 *
 * The static version hardcoded the production host twice, which meant a domain
 * change had to be remembered in a file nothing else references — and it wasn't:
 * the host here drifted out of sync with `SITE.url` (which already feeds the
 * canonical URL, the sitemap, the RSS feed and every OG image). Deriving it
 * from `SITE` makes `src/data/site.ts` the only place the host is written down,
 * so the next move can't leave a stale crawler directive behind.
 */
export const prerender = true;

export const GET: APIRoute = () => {
  // `new URL` rather than concatenation: `SITE.url` may or may not carry a
  // trailing slash, and a `//sitemap-index.xml` is a 404 to a crawler.
  const sitemap = new URL('/sitemap-index.xml', SITE.url).href;

  const body = `# ${SITE.url}
User-agent: *
Allow: /

Sitemap: ${sitemap}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
};

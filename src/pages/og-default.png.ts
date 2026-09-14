import type { APIRoute } from 'astro';
import { SITE } from '@/data/site';
import { ogResponse } from '@/lib/og';

/** Static — the site has no server runtime on Cloudflare Pages. */
export const prerender = true;

/**
 * The site-wide fallback card.
 *
 * `src/components/SEO.astro` defaults `og:image` to `/og-default.png`, so this
 * path is a contract: do not rename it without updating that component.
 */
export const GET: APIRoute = () =>
  ogResponse({
    title: SITE.name,
    eyebrow: SITE.role,
    subtitle: SITE.tagline,
  });

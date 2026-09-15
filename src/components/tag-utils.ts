/** Shared tag helpers for the blog routes. */

/** URL-safe slug for a tag, e.g. "Event Driven" → "event-driven". */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Site-absolute URL for a tag archive. */
export function tagHref(tag: string): string {
  return `/blog/tags/${tagSlug(tag)}/`;
}

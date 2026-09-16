/** Shared tag helpers for the blog routes. */

/**
 * URL-safe slug for a tag, e.g. "Event Driven" → "event-driven".
 *
 * Percent-encodes characters outside [a-z0-9-] instead of stripping them, so
 * distinct tags that differ only in punctuation (e.g. "C++", "C#", "C") never
 * collide on the same slug.
 */
export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, (char) => encodeURIComponent(char));
}

/** Site-absolute URL for a tag archive. */
export function tagHref(tag: string): string {
  return `/blog/tags/${tagSlug(tag)}/`;
}

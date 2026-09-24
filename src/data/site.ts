/**
 * Single source of truth for site-wide identity, SEO defaults and contact links.
 * Components and the Astro config both read from here — change it in one place.
 */

/** First day on the job — the one number the career length is derived from. */
export const CAREER_START = '2008-05';

/**
 * Full years since {@link CAREER_START}, recomputed on every build so the copy
 * ages by itself instead of drifting a year behind reality.
 */
export function yearsShipping(now = new Date()): number {
  const [startYear, startMonth] = CAREER_START.split('-').map(Number);
  const months =
    (now.getFullYear() - startYear) * 12 + (now.getMonth() + 1 - startMonth);
  return Math.floor(months / 12);
}

const NUMBER_WORDS: Record<number, string> = {
  10: 'Ten',
  11: 'Eleven',
  12: 'Twelve',
  13: 'Thirteen',
  14: 'Fourteen',
  15: 'Fifteen',
  16: 'Sixteen',
  17: 'Seventeen',
  18: 'Eighteen',
  19: 'Nineteen',
  20: 'Twenty',
  21: 'Twenty-one',
  22: 'Twenty-two',
  23: 'Twenty-three',
  24: 'Twenty-four',
  25: 'Twenty-five',
  26: 'Twenty-six',
  27: 'Twenty-seven',
  28: 'Twenty-eight',
  29: 'Twenty-nine',
  30: 'Thirty',
};

/** Capitalised word form for headline copy; falls back to the digits. */
export function yearsShippingWord(now = new Date()): string {
  const years = yearsShipping(now);
  return NUMBER_WORDS[years] ?? String(years);
}

const YEARS = yearsShipping();

export const SITE = {
  url: 'https://portfolio.abip.pt',
  name: 'Diogo Ferreira',
  role: 'Software Technical Lead',
  tagline: 'TypeScript · Node.js · AWS',
  location: 'Portugal',
  availability: 'Open to full-remote Tech Lead / Staff roles',
  description: `Software technical lead with ${YEARS} years building production systems on TypeScript, Node.js, React and AWS — marketplace checkout and payments, AI-assisted engineering, and four engineering teams built from scratch.`,
  // Points at the "coming soon" page until the PDF lands in public/; then set
  // it back to '/diogo-ferreira-cv.pdf'.
  cvPath: '/coming-soon/',
  locale: 'en',
  themeColor: '#123A5E',
} as const;

export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ferreiradfr' },
  { label: 'GitHub', href: 'https://github.com/abipster' },
] as const;

/**
 * Nav entries. Section links are absolute (`/#...`) so they work from every
 * page; `/blog/` is filtered out at render time while the collection is empty.
 */
export const NAV = [
  { label: 'Work', href: '/work/' },
  { label: 'Off the clock', href: '/off-the-clock/' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Writing', href: '/blog/' },
  { label: 'Contact', href: '/#contact' },
] as const;

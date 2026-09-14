/**
 * Single source of truth for site-wide identity, SEO defaults and contact links.
 * Components and the Astro config both read from here — change it in one place.
 */

/** Email is stored split so the plain string never appears in the served HTML. */
export const EMAIL_PARTS = ['ferreira.dfr', 'gmail.com'] as const;

export const SITE = {
  url: 'https://diogoferreira.dev',
  name: 'Diogo Ferreira',
  role: 'Principal Software Engineer',
  tagline: 'Full-Stack Systems · Cloud-Native Architecture',
  location: 'Lisbon, Portugal',
  availability: 'Open to full-remote Principal / Staff roles',
  description:
    'Principal software engineer with 18 years building production systems end to end — payment infrastructure, regulated platforms, and cloud-native architecture on AWS.',
  cvPath: '/diogo-ferreira-cv.pdf',
  locale: 'en',
  themeColor: '#123A5E',
} as const;

export const SOCIALS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ferreiradfr' },
] as const;

/** Nav entries. `/blog` is filtered out at render time while the collection is empty. */
export const NAV = [
  { label: 'Work', href: '/#work' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Off the clock', href: '/#hobbies' },
  { label: 'Writing', href: '/blog' },
  { label: 'Contact', href: '/#contact' },
] as const;

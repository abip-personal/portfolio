#!/usr/bin/env node
/**
 * Dependency-free internal link checker for the built site.
 *
 * Walks every HTML file in `dist/`, collects internal `href`/`src` targets and
 * verifies each one resolves to a file on disk (and, for `#fragment` links,
 * that an element with that id/name exists in the target document).
 *
 * External (http/https), `mailto:` and `tel:` links are reported but not
 * fetched: CI must stay offline and deterministic.
 *
 * Usage: node scripts/check-links.mjs [distDir]
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DIST = path.resolve(process.argv[2] ?? 'dist');

/**
 * Targets that are known-missing while the site is still being built out.
 * They are reported loudly but do not fail the run.
 *
 * TODO(wave-2): delete each entry as the thing it points at lands. The list
 * should be empty before the site goes live — an empty list is the goal, not
 * a permanent escape hatch.
 */
const SKIP_PAGES = new Set([]);

const KNOWN_PENDING = new Set([
  '/diogo-ferreira-cv.pdf', // public/ CV asset not committed yet (SITE.cvPath)
  '/#work',                 // home-page sections not built yet
  '/#experience',
  '/#hobbies',
  '/#contact',
]);

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Maps a site-absolute URL path to the file Cloudflare Pages would serve. */
async function resolveTarget(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const base = path.join(DIST, decoded);
  if (await exists(base)) {
    if ((await stat(base)).isFile()) return base;
    const index = path.join(base, 'index.html');
    if (await exists(index)) return index;
  }
  // Pages also serves /foo for /foo.html and /foo/index.html.
  for (const candidate of [`${base}.html`, path.join(base, 'index.html')]) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

const ATTR_RE = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const ID_RE = /\s(?:id|name)\s*=\s*["']([^"']+)["']/gi;

const idCache = new Map();
async function idsOf(file) {
  if (idCache.has(file)) return idCache.get(file);
  const html = await readFile(file, 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(ID_RE)) ids.add(m[1]);
  idCache.set(file, ids);
  return ids;
}

const errors = [];
const pending = new Set();
const externals = new Set();
let checked = 0;

const files = (await walk(DIST))
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !SKIP_PAGES.has(path.relative(DIST, f).replace(/\\/g, '/')));
if (files.length === 0) {
  console.error(`No HTML files found in ${DIST} — did the build run?`);
  process.exit(1);
}

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const fromUrl = `/${path.relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/')}`;
  const rel = path.relative(process.cwd(), file);

  for (const match of html.matchAll(ATTR_RE)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('javascript:')) continue;
    if (/^(https?:)?\/\//i.test(raw) || /^(mailto|tel):/i.test(raw)) {
      externals.add(raw);
      continue;
    }

    if (KNOWN_PENDING.has(raw)) {
      pending.add(`${raw}  (from ${rel})`);
      continue;
    }

    checked += 1;
    const [pathPart, hash] = raw.split('#');

    // Pure in-page anchor.
    if (pathPart === '') {
      if (hash && hash !== 'top' && !(await idsOf(file)).has(hash)) {
        errors.push(`${rel}: missing anchor #${hash}`);
      }
      continue;
    }

    const absolute = pathPart.startsWith('/')
      ? pathPart
      : path.posix.join(path.posix.dirname(fromUrl.endsWith('/') ? `${fromUrl}index` : fromUrl), pathPart);

    const target = await resolveTarget(absolute);
    if (!target) {
      errors.push(`${rel}: broken link -> ${raw}`);
      continue;
    }
    if (hash && target.endsWith('.html') && !(await idsOf(target)).has(hash)) {
      errors.push(`${rel}: missing anchor -> ${raw}`);
    }
  }
}

console.log(
  `Checked ${checked} internal link(s) across ${files.length} HTML file(s); ` +
    `skipped ${externals.size} external link(s).`,
);
for (const url of [...externals].sort()) console.log(`  external: ${url}`);

if (pending.size) {
  console.warn(`\n${pending.size} known-pending target(s) (not failing the run):`);
  for (const item of [...pending].sort()) console.warn(`  ${item}`);
  console.warn('  Remove these from KNOWN_PENDING in this script once they exist.');
}

if (errors.length) {
  console.error(`\n${errors.length} broken link(s):`);
  for (const err of errors) console.error(`  ${err}`);
  process.exit(1);
}
console.log('No broken internal links.');

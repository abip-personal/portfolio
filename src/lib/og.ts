/**
 * Build-time Open Graph card generation.
 *
 * Runs during `astro build` only (every consumer route is `prerender = true`),
 * and is fully offline: the Inter outlines come from the installed
 * `@fontsource-variable/inter` package, never from the network.
 *
 * Text is converted to vector outlines here rather than left as <text>, so the
 * final PNG never depends on a font being installed on the rasterising machine.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { create, type Font, type Glyph } from 'fontkitten';
import { Resvg } from '@resvg/resvg-js';
import { SITE } from '@/data/site';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Brand palette for the card. `brand` is the site's theme colour. */
const COLORS = {
  brand: '#123A5E',
  brandDeep: '#0C2740',
  accent: '#6FA8D6',
  ink: '#FFFFFF',
  muted: '#A9C8E2',
} as const;

const require = createRequire(import.meta.url);

let cachedFont: Font | null = null;

/**
 * Inter (variable, latin subset) straight out of node_modules.
 *
 * Only the wght=400 master is usable: `fontkitten.getVariation()` currently
 * loses the `cmap`/`maxp` tables on WOFF2 inputs, so heavier weights are
 * synthesised by stroking the outline (see `strokeFor`).
 */
function getFont(): Font {
  if (cachedFont) return cachedFont;
  const pkgJson = require.resolve('@fontsource-variable/inter/package.json');
  const file = path.join(path.dirname(pkgJson), 'files', 'inter-latin-wght-normal.woff2');
  const font = create(readFileSync(file));
  if (font.isCollection) throw new Error('Expected a single Inter font, got a collection');
  cachedFont = font;
  return font;
}

type Weight = 'regular' | 'medium' | 'bold';

/** Synthetic-bold stroke width, expressed in output pixels for a given size. */
function strokeFor(weight: Weight, size: number): number {
  if (weight === 'bold') return size * 0.036;
  if (weight === 'medium') return size * 0.016;
  return 0;
}

function glyphs(text: string): Glyph[] {
  return getFont().glyphsForString(text);
}

/** Advance width of `text` at `size`, in output pixels. */
export function measure(text: string, size: number): number {
  const scale = size / getFont().unitsPerEm;
  let total = 0;
  for (const glyph of glyphs(text)) total += glyph.advanceWidth * scale;
  return total;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Renders `text` as a single SVG path, baseline-anchored at (`x`, `y`).
 *
 * The glyph outlines are y-up in font units; the matrix below flips them and
 * scales them into output pixels without mutating fontkitten's cached paths.
 */
function textPath(text: string, x: number, y: number, size: number): string {
  const font = getFont();
  const scale = size / font.unitsPerEm;
  let pen = x;
  const parts: string[] = [];

  for (const glyph of glyphs(text)) {
    const tx = pen;
    const px = (v: number) => round(v * scale + tx);
    const py = (v: number) => round(y - v * scale);

    for (const { command, args } of glyph.path.commands) {
      switch (command) {
        case 'moveTo':
          parts.push(`M${px(args[0]!)} ${py(args[1]!)}`);
          break;
        case 'lineTo':
          parts.push(`L${px(args[0]!)} ${py(args[1]!)}`);
          break;
        case 'quadraticCurveTo':
          parts.push(`Q${px(args[0]!)} ${py(args[1]!)} ${px(args[2]!)} ${py(args[3]!)}`);
          break;
        case 'bezierCurveTo':
          parts.push(
            `C${px(args[0]!)} ${py(args[1]!)} ${px(args[2]!)} ${py(args[3]!)} ${px(args[4]!)} ${py(args[5]!)}`,
          );
          break;
        case 'closePath':
          parts.push('Z');
          break;
      }
    }
    pen += glyph.advanceWidth * scale;
  }

  return parts.join('');
}

interface TextOptions {
  size: number;
  fill: string;
  weight?: Weight;
}

function svgText(text: string, x: number, y: number, opts: TextOptions): string {
  const d = textPath(text, x, y, opts.size);
  if (!d) return '';
  const weight = opts.weight ?? 'regular';
  const stroke = strokeFor(weight, opts.size);
  const strokeAttrs = stroke
    ? ` stroke="${opts.fill}" stroke-width="${round(stroke)}" stroke-linejoin="round"`
    : '';
  return `<path d="${d}" fill="${opts.fill}"${strokeAttrs}/>`;
}

/** Greedy word wrap using real glyph advances. Returns at most `maxLines` lines. */
function wrap(text: string, size: number, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines) {
    // Ellipsise the final line if we ran out of room.
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      let last = lines[maxLines - 1]!;
      while (last && measure(`${last}…`, size) > maxWidth) {
        last = last.slice(0, -1).trimEnd();
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

export interface OgCard {
  /** Big headline. Defaults to the site owner's name. */
  title: string;
  /** Small line above the headline, e.g. "Case study" or "Writing". */
  eyebrow?: string;
  /** Supporting line under the headline. */
  subtitle?: string;
}

/** Composes the card as an SVG document. Exported for testing/debugging. */
export function renderOgSvg({ title, eyebrow, subtitle }: OgCard): string {
  const PAD = 88;
  const MAX = OG_WIDTH - PAD * 2;

  const titleSize = title.length > 46 ? 60 : 72;
  const titleLines = wrap(title, titleSize, MAX, 3);
  const lineHeight = titleSize * 1.22;

  // Vertically centre the headline block in the middle band of the card.
  const blockHeight = titleLines.length * lineHeight;
  const titleTop = (OG_HEIGHT - blockHeight) / 2 + titleSize * 0.36;

  const body: string[] = [];

  if (eyebrow) {
    body.push(
      svgText(eyebrow.toUpperCase(), PAD, titleTop - lineHeight * 0.55 - 34, {
        size: 26,
        fill: COLORS.accent,
        weight: 'medium',
      }),
    );
  }

  titleLines.forEach((line, i) => {
    body.push(
      svgText(line, PAD, titleTop + i * lineHeight, {
        size: titleSize,
        fill: COLORS.ink,
        weight: 'bold',
      }),
    );
  });

  if (subtitle) {
    const subLines = wrap(subtitle, 30, MAX, 2);
    subLines.forEach((line, i) => {
      body.push(
        svgText(line, PAD, titleTop + blockHeight + 18 + i * 42, {
          size: 30,
          fill: COLORS.muted,
        }),
      );
    });
  }

  const footerY = OG_HEIGHT - PAD + 10;
  const host = SITE.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  // The signature line is redundant on the default card, where the headline is
  // already the site owner's name.
  if (title !== SITE.name) {
    body.push(svgText(SITE.name, PAD, footerY, { size: 28, fill: COLORS.ink, weight: 'medium' }));
    body.push(
      svgText(SITE.role, PAD + measure(SITE.name, 28) + 24, footerY, {
        size: 28,
        fill: COLORS.muted,
      }),
    );
  }
  const hostWidth = measure(host, 28);
  body.push(
    svgText(host, OG_WIDTH - PAD - hostWidth, footerY, { size: 28, fill: COLORS.accent }),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${COLORS.brand}"/>
    <stop offset="1" stop-color="${COLORS.brandDeep}"/>
  </linearGradient>
</defs>
<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)"/>
<rect x="0" y="0" width="14" height="${OG_HEIGHT}" fill="${COLORS.accent}"/>
<rect x="${PAD}" y="${OG_HEIGHT - PAD - 26}" width="${OG_WIDTH - PAD * 2}" height="2" fill="${COLORS.accent}" fill-opacity="0.35"/>
${body.join('\n')}
</svg>`;
}

/** Renders the card to a PNG buffer. */
export function renderOgPng(card: OgCard): Buffer {
  const resvg = new Resvg(renderOgSvg(card), {
    fitTo: { mode: 'width', value: OG_WIDTH },
    background: COLORS.brand,
  });
  return resvg.render().asPng();
}

/** Standard `Response` for an OG endpoint. */
export function ogResponse(card: OgCard): Response {
  const png = renderOgPng(card);
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
